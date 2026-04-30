import HttpException from "../../exceptions/http.exception";
import authModel from "./auth.model";
import tokens from "../../utils/tokens";
import { AuthRole, IAuth, OauthProvider } from "./auth.interface";
import { TokenPayload } from "../../Middleware/auths";
import NodeMailerService from "../mail/nodemailer.service";
import OtpService from "../otp/opt.service";
import Mailtemplates from "../mail/mail.templates";
import ProfileService from "../profile/profile.service";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { OtpPurpose } from "../otp/opt.protocol";
import otpModel from "../otp/otp.model";
import crypto from "crypto";
import AgendaQueueService from "../mail/email.worker";
import AuditLogService from "../audit-logs/audit-log.service";
import logger from "../../utils/logger";

class AuthService {
  private Mail = new NodeMailerService();
  private Otp = new OtpService();
  private Profile = new ProfileService();
  private Agenda = new AgendaQueueService();
  private logs = new AuditLogService();

  public async register(
    data: IAuth,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const createdUser = await authModel.findOne({ email: data.email });
      if (createdUser)
        throw new HttpException(409, "Conflict", "User already exists");
      const createUser = new authModel(data);
      const userName = createUser.email.split("@")[0];
      const tokenSession = tokens.generateSessionId();
      const refreshSession = tokens.generateSessionId();
      const accessToken = tokens.generateAcessToken(createUser, tokenSession);
      const refreshToken = tokens.generaterefreshToken(
        createUser,
        refreshSession,
      );
      createUser.refreshToken = refreshToken;
      createUser.sessionToken = accessToken;
      await createUser.save();
     await this.Profile.createProfile({ 
        fullname: createUser.fullname,
        username: userName,
        uid: new Types.ObjectId(createUser.id),
        roles: createUser.userRole,
    });

   

     const OtpCode = await this.Otp.saveOtp(createUser.id.toString(),OtpPurpose.VERIFICATION);

     const templates = Mailtemplates.userVerificationTemplate.replace(
      "{{OTP_CODE}}",
        OtpCode,
    );
    
    await this.Agenda.sendNow(
      createUser.email,
      "Verify your Email",
      templates,
      "Verification",
    );
     await this.logs.logAction(
        {
     
        ipAddress: ipAddress,
        userAgent: userAgent,  
        actorId: createUser._id,
        actorType: createUser.userRole,
        action: "USER_REGISTRATION",
        entityType: createUser.userRole,
        entityId: createUser._id,
        status: "SUCCESS",
        metadata: { email: createUser.email, ipAddress: ipAddress },
        }
      )
      return { accessToken, refreshToken };
    } catch (error: any) {
      await this.logs.logAction(
        {
        actorId:data.id,  
        actorType: data.userRole,
        action: "USER_REGISTRATION",
        entityType: data.userRole,
        status: "FAILED",
        metadata: { email: data.email, error: error.message },
        }
      )
      throw new HttpException(
        404,
        "failed",
        `User registeration failed ${error}`,
      );
    }
  }

  public async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string ,message?:string}> {
    let user = null;
    try {
      user = await authModel.findOne({ email: email });

      //check if user has been registered

      if (!user) throw new HttpException(404, "Not found", "User not found");

      //check if users password is valid

      if (!(await user.isValidPassword(password)))
        throw new HttpException(401, "Unauthorized", "Invalid credentials");
      if (!user.isVerified){
         const OtpCode = await this.Otp.saveOtp(user.id.toString(),OtpPurpose.VERIFICATION);
     const templates = Mailtemplates.userVerificationTemplate.replace(
      "{{OTP_CODE}}",
        OtpCode,
    );
    await this.logs.logAction(
      {
        actorId: user._id,
        actorType: user.userRole,
        action: "USER_VERIFICATION_REQUESTED",
        entityType: user.userRole,
        entityId: user._id,
        status: "SUCCESS",
        metadata: { email: user.email },
      }
    )
    await this.Agenda.sendNow(
      user.email,
      "Verify your Email",
      templates,
      "Verification",
    );

    return {
      message:"User not verified Opt has been sent to your email ",
      accessToken: "",
      refreshToken: "",
    }

      }
       

      //check if user already has nan active session

      // if(user.sessionToken) throw new HttpException(409,"Conflict","User already has an active session")

      //Generate new tokens and create new session

      const tokenSession = tokens.generateSessionId();
      const refreshSession = tokens.generateSessionId();
      const accessToken = tokens.generateAcessToken(user, tokenSession);
      const refreshToken = tokens.generaterefreshToken(user, refreshSession);
      user.refreshToken = refreshToken;
      user.sessionToken = accessToken;

      await user.save();
      await this.logs.logAction(
        {
        actorId:user.id,  
        actorType: user.userRole,
        action: "USER_LOGIN",
        entityType: user.userRole,
        entityId: user.id,
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { email: user.email },
        }
      )
      return { accessToken, refreshToken };
    } catch (error: any) {
      await this.logs.logAction(
        {
        actorId:user?.id,  
        actorType: user?.userRole || AuthRole.User,
        action: "USER_LOGIN",
        entityType: user?.userRole || AuthRole.User,
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { email: email, error: error.message },
        }
      )
      throw new HttpException(404, "failed", `User login failed `);
    }
  }



  public async loginWithOauth(profile: any, provider: OauthProvider, ipAddress?: string, userAgent?: string) {
    try {
      const email = profile.emails?.[0]?.value;
      const fullName = profile.displayName;
      const avatar = profile.photos?.[0]?.value;
      const user = await authModel.findOne({ email });
      if (!user) {
        const newUser = new authModel({ email, fullname: fullName, avatar });
        await newUser.save();
        await this.Profile.createProfile({
          fullname: fullName,
          username: email.split("@")[0],
          uid: new Types.ObjectId(newUser.id),
          roles: newUser.userRole,
          image: avatar
        });
        await this.logs.logAction({
          actorId: newUser._id,
          actorType: newUser.userRole,
          action: "OAUTH_REGISTRATION",
          status: "SUCCESS",
          ipAddress,
          userAgent,
          metadata: { provider, email: profile.emails?.[0]?.value }
        });
        return { user: newUser };
      } else {
        const tokenSession = tokens.generateSessionId();
        const refreshSession = tokens.generateSessionId();
        const accessToken = tokens.generateAcessToken(user, tokenSession);
        const refreshToken = tokens.generaterefreshToken(user, refreshSession);
        user.refreshToken = refreshToken;
        user.sessionToken = accessToken;
        await user.save();
        await this.logs.logAction({
          actorId: user._id,
          actorType: user.userRole,
          action: "OAUTH_LOGIN",
          status: "SUCCESS",
          ipAddress,
          userAgent,
          metadata: { provider, email: user.email }
        });
        return { accessToken, refreshToken };
      }
    } catch (error: any) {
       await this.logs.logAction({
          actorType: AuthRole.User, // Default for pre-login error
          action: "OAUTH_LOGIN",
          status: "FAILED",
          ipAddress,
          userAgent,
          metadata: { provider, error: error.message }
        });
        throw new HttpException(400, "failed", `OAuth login failed `);
    }
  }


  public async refreshToken(
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ refreshToken: string; accessToken: string }> {
    try {
      const decoded = (await tokens.verifyRefreshToken(token)) as JwtPayload;
      const user = await authModel.findById(decoded.id);
      if (!user)
        throw new HttpException(401, "Not found", "User doesn't exist");
      const tokenSession = tokens.generateSessionId();
      const refreshSession = tokens.generateSessionId();
      const accessToken = tokens.generateAcessToken(user, tokenSession);
      const refreshToken = tokens.generaterefreshToken(user, refreshSession);
      user.refreshToken = refreshToken;
      user.sessionToken = accessToken;
      await user.save();
      await this.logs.logAction({
        actorId: user._id,
        actorType: user.userRole,
        action: "TOKEN_REFRESH",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { userId: user._id }
      });
      return { refreshToken, accessToken };
    } catch (error: any) {
      await this.logs.logAction({
        actorType: AuthRole.User,
        action: "TOKEN_REFRESH",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { error: error.message }
      });
      throw new HttpException(
        404,
        "failed",
        `Failed to generate a new accessToken `,
      );
    }
  }


  public async forgotPassword(email: string, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    let user = null;
    try {
      user = await authModel.findOne({ email: email });
      if (!user) {
        return { message:"If your email is registered, you will receive an OTP Code"};
      }
      try {
        const uid = user.id.toString();
        const otp = await this.Otp.saveOtp(uid,OtpPurpose.RESETPASSWORD);
       

        const templates = Mailtemplates.forgotPasswordTemplate.replace(
          "{{OTP_CODE}}",
          otp,
        );

        await this.Agenda.sendNow(
          user.email,
          "Verify your Email",
          templates,
          "Verification",
        );
      } catch (error) {
        logger.error(`Email couldn't be sent to user`, { error });
      }
      const tokenSession = tokens.generateSessionId();
      const resetToken = tokens.generateAcessToken(user, tokenSession);
      
      await this.logs.logAction({
        actorId: user._id,
        actorType: user.userRole,
        action: "PASSWORD_RESET_REQUEST",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { email: user.email }
      });

      return {
        message:
          "If your email is registered, you will receive an OTP Code",
        // resetCode: resetToken
      };
    } catch (error: any) {
      await this.logs.logAction({
        actorId: user?._id,
        actorType: user?.userRole || AuthRole.User,
        action: "PASSWORD_RESET_REQUEST",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { email, error: error.message }
      });
      throw new Error(
        `Failed to process forgot password request: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }


  public async sendOtp(email: string, purpose: OtpPurpose, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    let user = null;
    try {
      user = await authModel.findOne({ email: email });
      if (!user) {
        return { message: "User email hasn't been registered to our platform" };
      }
      try {
        const uid = user.id.toString();
        const otp = await this.Otp.saveOtp(uid,purpose);
      
        let templates:string;
        let subject:string;
        if(purpose === OtpPurpose.VERIFICATION){
        subject = "Verify your Email"  
        templates = Mailtemplates.userVerificationTemplate.replace(
          "{{OTP_CODE}}",
          otp,
        );
        }
        if(purpose === OtpPurpose.RESETPASSWORD){
          subject = "Reset your Password"
          templates = Mailtemplates.forgotPasswordTemplate.replace(
            "{{OTP_CODE}}",
            otp,
          );
        }
        
        await this.Agenda.sendNow(
          user.email,
          subject,
          templates,
          "Verification",
        );
      } catch (error) {
        logger.error(`Email couldn't be sent to user`, { error });
      }
      
      await this.logs.logAction({
        actorId: user._id,
        actorType: user.userRole,
        action: "OTP_SENT",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { email: user.email, purpose }
      });

      return {
        message:
          "If your email is registered, you will receive a password reset link",
        // resetCode: resetToken
      };
    } catch (error: any) {
      await this.logs.logAction({
        actorId: user?._id,
        actorType: user?.userRole || AuthRole.User,
        action: "OTP_SENT",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { email, purpose, error: error.message }
      });
      throw new Error(
        `Failed to process forgot password request: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }


  public async validateOtp(email: string, otp: string, purpose: string, ipAddress?: string, userAgent?: string) {
    let user = null;
    try {
      user = await authModel.findOne({ email: email });
      if (!user) {
        throw new HttpException(400, "Invalid", "Invalid email or OTP");
      }

      const verifyOtp = await this.Otp.veriryOtp(user.id.toString(),otp);  
      if (!verifyOtp) {
        throw new HttpException(400, "Expired", "OTP expired or invalid");
      }

      const otpRecord = await otpModel.findOneAndDelete({
        uid:user.id.toString(),
        otp:otp,
        type:purpose,
        expiresAt: { $gt: new Date() },
      });
      if(!user.isVerified && purpose === OtpPurpose.Registration){
        const userVerified = await authModel.findByIdAndUpdate(
           user.id,
          { isVerified: true },
          { new: true }
        );

        this.sendWelcomeEmail(user);
      } 
      
      await this.logs.logAction({
        actorId: user._id,
        actorType: user.userRole,
        action: "OTP_VALIDATED",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { email: user.email, purpose }
      });

      if(purpose === OtpPurpose.RESETPASSWORD){
        const tokenSession = tokens.generateSessionId();
        const resetToken = tokens.generateAcessToken(user, tokenSession);
        return {
          success: true,
          message: "OTP verified ",
          resetToken: resetToken
        };
      }

      if (purpose === OtpPurpose.VERIFICATION) {
        return {
          success: true,
          message: "OTP verified "
        };
      }

      return { success: true };
    } catch (error: any) {
       await this.logs.logAction({
        actorId: user?._id,
        actorType: user?.userRole || AuthRole.User,
        action: "OTP_VALIDATED",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { email, purpose, error: error.message }
      });
      throw error;
    }
  }

  // public async validateOtp(
  //   email: string,
  //   token: string,
  // ): Promise<{ messeage: string }> {
  //   try {
  //     const user = await authModel.findOne({ email: email });
  //     if (!user)
  //       throw new HttpException(404, "Not Found", "User doesn't exist");
  //     const id = user.id;
  //     const verifyOtp = await this.Otp.veriryOtp(id, token);
  //     if (verifyOtp === true) {
  //       return {
  //         messeage:
  //           "User OTP Code has been validated  you can now reset your password",
  //       };
  //     }
  //     //    const tokenSession = tokens.generateSessionId();
  //     //    const  refreshSession = tokens.generateSessionId();
  //     //    const accessToken = tokens.generateAcessToken(user,tokenSession);
  //     //    const refreshToken = tokens.generaterefreshToken(user,refreshSession);
  //   } catch (error) {
  //     throw new HttpException(400, "failed", `Failed to validate OTP ${error}`);
  //   }
  // }

  public async resetPassword(
    password: string,
    resetToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    let user = null;
    try {
      const decoded = (await tokens.verifyAccessToken(resetToken)) as JwtPayload;
      const email = decoded.email;
      user = await authModel.findOne({ email: email });
      if (!user) throw new HttpException(404, "Not found", "User not found");

      user.sessionToken = null;
      user.refreshToken = null;
      user.password = password;
    
      await user.save();
      
      await this.logs.logAction({
        actorId: user._id,
        actorType: user.userRole,
        action: "PASSWORD_RESET_COMPLETE",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { email: user.email }
      });

    } catch (error: any) {
      await this.logs.logAction({
        actorId: user?._id,
        actorType: user?.userRole || AuthRole.User,
        action: "PASSWORD_RESET_COMPLETE",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { error: error.message }
      });
      throw new HttpException(
        400,
        "failed",
        `Failed to reset password`,
      );
    }
  }

  public async logout(auth: TokenPayload, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const result = await authModel.findByIdAndUpdate(
        auth?.id,
        {
          $unset: {
            sessionToken: "",
            refreshToken: "",
          },
        },
        { new: true },
      );
      if (!result)
        throw new HttpException(404, "User not found", "Login failed");
      await result.save();
      
      await this.logs.logAction({
        actorId: auth?.id,
        actorType: auth?.userRole || AuthRole.User,
        action: "USER_LOGOUT",
        status: "SUCCESS",
        ipAddress,
        userAgent,
        metadata: { userId: auth?.id }
      });
    } catch (error: any) {
      await this.logs.logAction({
        actorId: auth?.id,
        actorType: auth?.userRole || AuthRole.User,
        action: "USER_LOGOUT",
        status: "FAILED",
        ipAddress,
        userAgent,
        metadata: { error: error.message }
      });
      throw new HttpException(400, "failed", `User logout failed`);
    }
  }



  private async sendWelcomeEmail(user: IAuth): Promise<void> {
  const welcomeHtml = Mailtemplates.welcomeTemplate.replace(
    "{{USER_NAME}}",
    user.fullname
  );

  await this.Agenda.sendMail(
    user.email,
    "Welcome to Venato!",
    welcomeHtml,
    "Welcome",
    "in 1 minute"
  );
}
}

export default AuthService;
