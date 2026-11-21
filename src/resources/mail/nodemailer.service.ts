import dns from "dns";
import net from "net";
import nodemailer, { Transporter } from "nodemailer";
import logger from "../../utils/logger";

const TRANSPORTER_TTL_MS = 5 * 60 * 1000;

class NodeMailerService {
  private transporter: Transporter | null = null;
  private transporterCreatedAt = 0;

  private async resolveIPv4Host(host: string): Promise<string> {
    if (net.isIP(host)) {
      return host;
    }

    try {
      const { address } = await dns.promises.lookup(host, { family: 4 });
      return address;
    } catch (error: any) {
      logger.warn(
        `IPv4 lookup failed for SMTP host "${host}", falling back to hostname: ${error.message}`,
      );
      return host;
    }
  }

  private async getTransporter(): Promise<Transporter> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
      );
    }

    const isFresh =
      this.transporter &&
      Date.now() - this.transporterCreatedAt < TRANSPORTER_TTL_MS;

    if (isFresh && this.transporter) {
      return this.transporter;
    }

    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }

    const resolvedHost = await this.resolveIPv4Host(host);

    this.transporter = nodemailer.createTransport({
      host: resolvedHost,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        servername: host,
      },
      auth: {
        user,
        pass,
      },
    });
    this.transporterCreatedAt = Date.now();

    return this.transporter;
  }

  public async sendMail(
    recieverEmails: string | string[],
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    try {
      const transporter = await this.getTransporter();

      const sender = this.getSender();
      if (!sender.address) {
        throw new Error(
          "Sender email is not configured. Set SMTP_FROM or SMTP_USER in environment variables.",
        );
      }

      const reciever = Array.isArray(recieverEmails)
        ? recieverEmails
        : [recieverEmails];

      const info = await transporter.sendMail({
        from: sender,
        to: reciever,
        subject,
        html: content,
        text: this.htmlToPlainText(content),
        headers: {
          "X-Mail-Category": mailCategory || "General",
        },
      });

      logger.info(`Email sent successfully to ${reciever}`, {
        subject,
        mailCategory,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      });

      return info;
    } catch (error: any) {
      if (this.transporter) {
        this.transporter.close();
        this.transporter = null;
        this.transporterCreatedAt = 0;
      }

      logger.error(
        `[EMAIL ERROR] Job <${recieverEmails}> failed: ${error.message}`,
        {
          message: error.message,
          code: error.code,
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
