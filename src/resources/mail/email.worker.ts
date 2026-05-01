import NodeMailerService from "./nodemailer.service";
import { agenda } from "../../helpers/agenda";
import { Job } from "agenda";
import HttpException from "../../exceptions/http.exception";
import logger from "../../utils/logger";
import AuditLogService from "../audit-logs/audit-log.service";
import { AuthRole } from "../auths/auth.interface";

const nodeMailerService = new NodeMailerService();
const auditLogService = new AuditLogService();

// Define the sendMail job handler
agenda.define("sendMail", async (job: Job) => {
  try {
    const { email, subject, content, mailCategory } = job.attrs.data;
    const result = await nodeMailerService.send(email, subject, content, mailCategory);
  
    await job.remove();
  } catch (error: any) {
    await auditLogService.logAction({
      action: "EMAIL_FAILED",
      status: "FAILED",
      actorId: "system",
      actorType:AuthRole.User,
      entityType: "EMAIL",
      entityId: job.attrs.data.email,
      metadata: { email: job.attrs.data.email, error: error.message },
      ipAddress: "system",
      userAgent: "system",
    });
    logger.error(`[QUEUE ERROR] Job <${job.attrs.name}> failed: ${error.message}`, { error });
  }
});

class AgendaQueueService {
  private agenda = agenda;

  /**
   * Schedule an email to be sent at a specific time
   */
  public async sendMail(
    email: string,
    subject: string,
    content: string,
    mailCategory: string,
    when: string
  ) {
    try {
      await this.agenda.schedule(when, "sendMail", {
        email,
        subject,
        content,
        mailCategory,
      });
    } catch (error) {
       await auditLogService.logAction({
      action: "EMAIL_FAILED",
      status: "FAILED",
      actorId: "system",
      actorType:AuthRole.User,
      entityType: "EMAIL",
      entityId: email,
      metadata: { email: email, error: error.message },
      ipAddress: "system",
      userAgent: "system",
    });
      throw new HttpException(500, "Queue Failed", "Queue Error");
    }
  }

  /**
   * Send an email immediately using the queue
   */
  public async sendNow(
    email: string,
    subject: string,
    content: string,
    mailCategory: string
  ) {
    try {
      await this.agenda.now("sendMail", {
        email,
        subject,
        content,
        mailCategory,
      });
    } catch (error) {
       await auditLogService.logAction({
      action: "EMAIL_FAILED",
      status: "FAILED",
      actorId: "system",
      actorType:AuthRole.User,
      entityType: "EMAIL",
      entityId: email,
      metadata: { email: email, error: error.message },
      ipAddress: "system",
      userAgent: "system",
    });
   logger.error(`[QUEUE ERROR] Job <${email}> failed`, {
  message: error.message,
  stack: error.stack,
  code: error.code,
  response: error.response,
  command: error.command,
  full: error,
});
      throw new HttpException(500, "Queue Failed", "Queue Error");
    }
  }
}

export default AgendaQueueService;
