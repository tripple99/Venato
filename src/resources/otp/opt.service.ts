import {generate} from "otp-generator"
import otpModel from "./otp.model"
import { OtpPurpose } from "./opt.protocol";


const TEN_MINUTES_MS = 10 * 60 * 1000;

class OtpService{
  
  public async generateOtp(): Promise<String | Error> {
    const otp = generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: true,
      specialChars: false,
    });
    return otp;
  }
  public async saveOtp(uid:string,purpose:OtpPurpose):Promise<string>{
    const otp = await this.generateOtp();
    const expiresAt =  new Date(Date.now() + TEN_MINUTES_MS);
    const optDocument = await otpModel.create({uid,otp,expiresAt,purpose:purpose});
    optDocument.save();
    return optDocument.otp;
  }

  public async veriryOtp(uid: string, otp: string): Promise<boolean> {
    const otpVerify = await otpModel.findOneAndUpdate(
      { uid, otp, isVerified: false, expiresAt: { $gt: new Date() } },
      { $set: { isVerified: true } },
      { new: true }
    );
    
    return !!otpVerify;
  }
}
export default OtpService;