import axios from "axios";
import dns from "dns";
import net from "net";
import nodemailer, { Transporter } from "nodemailer";
import logger from "../../utils/logger";

const TRANSPORTER_TTL_MS = 5 * 60 * 1000;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

class NodeMailerService {
  private transporter: Transporter | null = null;
  private transporterCreatedAt = 0;
  private activePort: number | null = null;

  private async resolveIPv4Host(host: string): Promise<string> {
    if (net.isIP(host)) {
      return host;
    }

    try {
      const { address } = await dns.promises.lookup(host, { family: 4 });
      return address;
    } catch (error: any) {
      logger.warn(
        `[EMAIL] IPv4 lookup failed for SMTP host "${host}", falling back to hostname: ${error.message}`,
      );
      return host;
    }
  }

  private async createTransporterForPort(portOverride?: number): Promise<{
    transporter: Transporter;
    host: string;
    resolvedHost: string;
    port: number;
    secure: boolean;
  }> {
    const host = process.env.SMTP_HOST;
    const port = portOverride ?? (Number(process.env.SMTP_PORT) || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        "SMTP is not configured. Set BREVO_API_KEY (recommended on Render) or SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
      );
    }

    const resolvedHost = await this.resolveIPv4Host(host);
    const secure = port === 465;

    logger.info("[EMAIL] Creating SMTP transporter", {
      host,
      resolvedHost,
      port,
      secure,
      user,
    });

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port,
      secure,
      requireTLS: !secure,
      pool: true,
      maxConnections: 5,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        servername: host,
      },
      auth: {
        user,
        pass,
      },
    });

    return { transporter, host, resolvedHost, port, secure };
  }

  private async getTransporter(): Promise<{
    transporter: Transporter;
    port: number;
  }> {
    const configuredPort = Number(process.env.SMTP_PORT) || 587;
    const isFresh =
      this.transporter &&
      this.activePort !== null &&
      Date.now() - this.transporterCreatedAt < TRANSPORTER_TTL_MS;

    if (isFresh && this.transporter && this.activePort !== null) {
      return { transporter: this.transporter, port: this.activePort };
    }

    this.resetTransporter();

    const created = await this.createTransporterForPort(configuredPort);
    this.transporter = created.transporter;
    this.activePort = created.port;
    this.transporterCreatedAt = Date.now();

    return { transporter: this.transporter, port: created.port };
  }

  private resetTransporter() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.transporterCreatedAt = 0;
      this.activePort = null;
    }
  }

  private isConnectionError(error: any): boolean {
    const code = String(error?.code || "").toUpperCase();
    const msg = String(error?.message || "").toLowerCase();
    return (
      ["ETIMEDOUT", "ECONNECTION", "ECONNREFUSED", "ENETUNREACH", "ESOCKET"].includes(code) ||
      msg.includes("timeout") ||
      msg.includes("timed out")
    );
  }

  private async sendViaBrevoHttp(
    recipients: string[],
    subject: string,
    content: string,
    mailCategory: string,
    sender: { name: string; address: string },
  ) {
    const apiKey = process.env.BREVO_API_KEY!;

    logger.info("[EMAIL] Sending email via Brevo HTTPS API", {
      to: recipients,
      from: sender.address,
      subject,
      mailCategory,
    });

    try {
      const response = await axios.post(
        BREVO_API_URL,
        {
          sender: {
            name: sender.name,
            email: sender.address,
          },
          to: recipients.map((email) => ({ email })),
          subject,
          htmlContent: content,
          textContent: this.htmlToPlainText(content),
          tags: [mailCategory || "General"],
        },
        {
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        },
      );

      logger.info(`[EMAIL] Sent successfully via Brevo API to ${recipients}`, {
        subject,
        mailCategory,
        status: response.status,
        messageId: response.data?.messageId,
      });

      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      const errMessage =
        data?.message || error.message || "Brevo API request failed";

      logger.error(`[EMAIL ERROR] Brevo API failed for <${recipients}>: ${errMessage}`, {
        status,
        code: data?.code || error.code,
        response: data,
      });

      const wrapped: any = new Error(errMessage);
      wrapped.code = data?.code || error.code;
      wrapped.responseCode = status;
      wrapped.response = data;
      wrapped.command = "BREVO_HTTP_API";
      throw wrapped;
    }
  }

  public async sendMail(
    recieverEmails: string | string[],
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    const sender = this.getSender();
    if (!sender.address) {
      throw new Error(
        "Sender email is not configured. Set BREVO_SENDER_EMAIL, SMTP_FROM, or SMTP_USER in environment variables.",
      );
    }

    const reciever = Array.isArray(recieverEmails)
      ? recieverEmails
      : [recieverEmails];

    // Prefer HTTPS API when configured (required on hosts like Render that block outbound SMTP)
    if (process.env.BREVO_API_KEY) {
      return this.sendViaBrevoHttp(reciever, subject, content, mailCategory, sender);
    }

    const mailOptions = {
      from: sender,
      to: reciever,
      subject,
      html: content,
      text: this.htmlToPlainText(content),
      headers: {
        "X-Mail-Category": mailCategory || "General",
      },
    };

    let usedPort = Number(process.env.SMTP_PORT) || 587;

    try {
      const { transporter, port } = await this.getTransporter();
      usedPort = port;

      logger.info("[EMAIL] Sending email via SMTP", {
        to: reciever,
        subject,
        mailCategory,
        host: process.env.SMTP_HOST,
        port,
      });

      const info = await transporter.sendMail(mailOptions);

      logger.info(`[EMAIL] Sent successfully to ${reciever}`, {
        subject,
        mailCategory,
        port,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return info;
    } catch (error: any) {
      this.resetTransporter();

      const fallbackPort = usedPort === 465 ? 587 : usedPort === 587 ? 465 : null;
      if (fallbackPort && this.isConnectionError(error)) {
        logger.warn(
          `[EMAIL] Connection failed on port ${usedPort} (${error.message}). Retrying on fallback port ${fallbackPort}...`,
          {
            to: reciever,
            host: process.env.SMTP_HOST,
            failedPort: usedPort,
            fallbackPort,
            code: error.code,
          },
        );

        try {
          const fallback = await this.createTransporterForPort(fallbackPort);
          this.transporter = fallback.transporter;
          this.activePort = fallback.port;
          this.transporterCreatedAt = Date.now();

          const info = await fallback.transporter.sendMail(mailOptions);

          logger.info(
            `[EMAIL] Sent successfully to ${reciever} via fallback port ${fallbackPort}`,
            {
              subject,
              mailCategory,
              port: fallbackPort,
              messageId: info.messageId,
              accepted: info.accepted,
              rejected: info.rejected,
            },
          );

          return info;
        } catch (fallbackError: any) {
          this.resetTransporter();
          logger.error(
            `[EMAIL ERROR] Fallback port ${fallbackPort} also failed for <${recieverEmails}>: ${fallbackError.message}`,
            {
              host: process.env.SMTP_HOST,
              primaryPort: usedPort,
              fallbackPort,
              message: fallbackError.message,
              code: fallbackError.code,
              errno: fallbackError.errno,
              syscall: fallbackError.syscall,
              address: fallbackError.address,
              responseCode: fallbackError.responseCode,
              response: fallbackError.response,
              command: fallbackError.command,
            },
          );
          throw fallbackError;
        }
      }

      logger.error(
        `[EMAIL ERROR] Job <${recieverEmails}> failed: ${error.message}`,
        {
          host: process.env.SMTP_HOST,
          port: usedPort,
          message: error.message,
          code: error.code,
          errno: error.errno,
          syscall: error.syscall,
          address: error.address,
          responseCode: error.responseCode,
          response: error.response,
          command: error.command,
        },
      );
      throw error;
    }
  }

  public async send(
    email: string | string[],
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    return this.sendMail(email, subject, content, mailCategory);
  }

  private getSender() {
    return {
      name: process.env.SMTP_FROM_NAME || "Venato",
      address:
        process.env.BREVO_SENDER_EMAIL ||
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        process.env.GMAIL_USER ||
        "",
    };
  }

  private htmlToPlainText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export default NodeMailerService;
