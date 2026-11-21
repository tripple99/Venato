import nodemailer, { Transporter } from "nodemailer";
import logger from "../../utils/logger";

class NodeMailerService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      logger.warn(
        "SMTP configuration incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user,
        pass,
      },
    });
  }

  public async sendMail(
    recieverEmails: string | string[],
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    try {
      if (!this.transporter) {
        this.initTransporter();
      }
      if (!this.transporter) {
        throw new Error(
          "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.",
        );
      }

      const sender = this.getSender();
      if (!sender.address) {
        throw new Error(
          "Sender email is not configured. Set SMTP_FROM or SMTP_USER in environment variables.",
        );
      }

      const reciever = Array.isArray(recieverEmails)
        ? recieverEmails
        : [recieverEmails];

      const info = await this.transporter.sendMail({
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
