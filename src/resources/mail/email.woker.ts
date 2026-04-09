import NodeMailerService from "./nodemailer.service";
import { agenda } from "../../helpers/agenda";
import { Job } from "agenda";
import HttpException from "../../exceptions/http.exception";
class AgendQueueService {
  private nodeMailerService: NodeMailerService = new NodeMailerService();
  private agenda = agenda;

  public async sendMail(
    email: string,
    subject: string,
    content: string,
    mailCategory: string,
    when:string
  ) {
    try {
      this.agenda.schedule(when, "sendMail", {
        email,
        subject,
        content,
        mailCategory,
        

      }
    
    );
       
    } catch (error) {
      throw new HttpException(500, `Queue Failed`, "Queue Error");
    }
  }

  public async sendNow(
    email: string,
    subject: string,
    content: string,
    mailCategory: string,
  ) {
    try {
      await this.agenda.now("sendMail", {
        email,
        subject,
        content,
        mailCategory,
      });
    } catch (error) {
      throw new HttpException(500, `Queue Failed`, "Queue Error");
    }
  }
}

export default AgendQueueService;
