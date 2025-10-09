import HttpException from "../../exceptions/http.exception";
import nodemailer from "nodemailer"



class NodeMailerService{
  public async sendMail(
     recieverEmails: string | string[],
     subject:string,
     content:string,
     mailCategory:string,
    
  ){
    try {
    const transporter = this.createTransporter();
    const user = this.getSender();
    const reciever = Array.isArray(recieverEmails) ? recieverEmails : [recieverEmails]
    // const htmlContent = 
    const info = await transporter.sendMail({
       from:user,
       to:reciever,
       subject:subject,
       html: content,
       headers:{category:mailCategory || "General"} 
    })    
    console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
       console.error(`Error sending email: ${error}`);
    }
   
  }
      public async send(
        email: string,
        subject: string,
        content: string,
        mailCategory: string,
   
    ) {
       
        return this.sendMail(email, subject,content,mailCategory);
    }
  private createTransporter(){
     const user = process.env.GMAIL_USER 
     const password = process.env.GMAIL_PASS 

     return nodemailer.createTransport({
       host: "smtp.gmail.com",
       port:465,
       secure:true,
       auth:{
          user:user,
          pass:password,
       }
     }as nodemailer.TransportOptions)
  }
  private getSender(){
    return {
      address:process.env.GMAIL_USER || '',
      name:'Venato'
    }
  }
}

export default NodeMailerService;