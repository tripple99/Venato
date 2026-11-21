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
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error("SENDGRID_API_KEY is not defined in environment variables.");
      }

      const sender = this.getSender();
      if (!sender.email) {
        throw new Error(
          "Sender email is not configured. Set SENDGRID_SENDER_EMAIL in environment variables.",
        );
      }

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
      const sgDetails = error.response?.body
        ? JSON.stringify(error.response.body)
        : error.message;
      logger.error(`[EMAIL ERROR] Job <${recieverEmails}> failed: ${sgDetails}`, {
        message: error.message,
        code: error.code,
        response: error.response?.body,
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
