import NodeMailerService from "./nodemailer.service";
import { agenda } from "../../helpers/agenda";
import { Job } from "agenda";
import HttpException from "../../exceptions/http.exception";

const nodeMailerService = new NodeMailerService();

// Define the sendMail job handler
agenda.define("sendMail", async (job: Job) => {
  try {
    const { email, subject, content, mailCategory } = job.attrs.data;
    await nodeMailerService.send(email, subject, content, mailCategory);
  } catch (error: any) {
    console.error(`[QUEUE ERROR] Job <${job.attrs.name}> failed: ${error.message}`);
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
      throw new HttpException(500, "Queue Failed", "Queue Error");
    }
  }
}

export default AgendaQueueService;
