import sgMail from "@sendgrid/mail";
import logger from "../../utils/logger";

class NodeMailerService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY || "";
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      logger.warn("SENDGRID_API_KEY is not defined in environment variables.");
    }
  }

  public async sendMail(
    recieverEmails: string | string[],
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    try {
      const sender = this.getSender();
      const reciever = Array.isArray(recieverEmails)
        ? recieverEmails
        : [recieverEmails];

      const msg = {
        to: reciever,
        from: sender,
        subject: subject,
        html: content,
        categories: [mailCategory || "General"],
      };

      const [response] = await sgMail.send(msg);

      logger.info(`Email sent successfully to ${reciever}`, {
        subject,
        mailCategory,
        statusCode: response.statusCode,
        messageId: response.headers["x-message-id"],
      });
      return response;
    } catch (error: any) {
      logger.error(`[EMAIL ERROR] Job <${recieverEmails}> failed`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response?.body,
        full: error,
      });
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
      email: process.env.SENDGRID_SENDER_EMAIL || process.env.GMAIL_USER || "",
      name: "Venato",
    };
  }
}

export default NodeMailerService;
