import HttpException from "../../exceptions/http.exception";
import authModel from "./auth.model";
import tokens from "../../utils/tokens";
import { IAuth,OauthProvider } from "./auth.interface";
import { TokenPayload } from "../../Middleware/auths";
import NodeMailerService from "../mail/nodemailer.service";
import OtpService from "../otp/opt.service";
import Mailtemplates from "../mail/mail.templates";
import ProfileService from "../profile/profile.service";
import { Types } from "mongoose";
class AuthService {
     private Mail = new NodeMailerService();
     private Otp = new OtpService();
     private Profile = new ProfileService();

     public async register(data:IAuth):Promise<{accessToken:string,refreshToken:string}>{
     try {
        const createdUser = await authModel.findOne({email:data.email});
        if(createdUser) throw new HttpException(404,'Not found',"User already exists");
        const createUser = new authModel(data)
        const userName = createUser.email.split("@")[0];
        const tokenSession = tokens.generateSessionId();
        const  refreshSession = tokens.generateSessionId();
        const accessToken = tokens.generateAcessToken(createUser,tokenSession);
        const refreshToken = tokens.generaterefreshToken(createUser,refreshSession);
        createUser.refreshToken = refreshToken;
        createUser.sessionToken = accessToken;
        await createUser.save();
        const userProfile = this.Profile.createProfile({
            fullname:createUser.fullname,
            username:userName,
            uid:new Types.ObjectId(createUser.id),
            roles:createUser.userRole,
            userMarket:createUser.allowedMarkets
          
        })  
        return {accessToken,refreshToken}
     }catch (error) {
        throw new HttpException(404,'failed',`User registeration failed ${error}`)
     }
    }
    
    public async login(email:string,password:string):Promise<{accessToken:string,refreshToken:string}>{
        try {
           
            
            const user = await authModel.findOne({email:email});
           
            //check if user has been registered

            if(!user) throw new HttpException(404,'Not found',"User not found");

            //check if users password is valid 

            if(!(await user.isValidPassword(password))) throw new HttpException(401,"Unauthorized","Invalid credentials")

            //check if user already has nan active session 
            
            // if(user.sessionToken) throw new HttpException(409,"Conflict","User already has an active session")
 
            //Generate new tokens and create new session
                
            const tokenSession = tokens.generateSessionId();
            const  refreshSession = tokens.generateSessionId();
            const accessToken = tokens.generateAcessToken(user,tokenSession);
            const refreshToken = tokens.generaterefreshToken(user,refreshSession);
            user.refreshToken = refreshToken;
            user.sessionToken = accessToken;
            
            await user.save();
            return {accessToken,refreshToken}   
        } catch (error) {
            throw new HttpException(404,"failed",`User login failed ${error}`);
        }
    }

    public async loginWithOauth(profile:any,provider:OauthProvider){

        const email = profile.emails?.[0]?.value;
        const fullName = profile.displayName;
        const avatar = profile.photos?.[0]?.value;
        const user = await authModel.findOne({email});
        if(!user){
            const newUser = new authModel({email,fullName,avatar});
        
        }else{
            const tokenSession = tokens.generateSessionId();
            const  refreshSession = tokens.generateSessionId();
            const accessToken = tokens.generateAcessToken(user,tokenSession);
            const refreshToken = tokens.generaterefreshToken(user,refreshSession);
            user.refreshToken = refreshToken;
            user.sessionToken = accessToken;
            await user.save();
            return {accessToken,refreshToken}
        }
    } 

    public async refreshToken(token:string):Promise<{refreshToken:string,accessToken:string}>{
         try {
            const decoded = await tokens.verifyRefreshToken(token)
            const user = await authModel.findOne({decoded});
            if(!user) throw new HttpException(401,"Not found","User doesn't exist")
            const tokenSession = tokens.generateSessionId();
            const  refreshSession = tokens.generateSessionId();
            const accessToken = tokens.generateAcessToken(user,tokenSession);
            const refreshToken = tokens.generaterefreshToken(user,refreshSession);
            user.refreshToken = refreshToken;
            user.sessionToken = accessToken;
            await user.save();
            return {refreshToken,accessToken}   
            
         } catch (error) {
            throw new HttpException(404,"failed",`Failed to generate a new accessToken ${error}`)
         }
    }

    public async forgotPassword(email:string):Promise<{message:string,resetCode:string}>{
        try {
            const user = await  authModel.findOne({email:email});
            if(!user){
               return {message:"User email hasn't been registered to our platform",resetCode:""};
            }  
            try {
                const uid = user.id.toString();
                const otp = await this.Otp.saveOtp(uid)
                console.log(otp);
                
                const templates = Mailtemplates.forgotPasswordTemplate.replace("{{OTP_CODE}}", otp)
              
                await this.Mail.send(user.email,"Verify your Email",templates,"Verification")
            } catch (error) {
                console.log(`Email couldn't be sent to user ${error}`);
            }
            const tokenSession = tokens.generateSessionId();
            const resetToken = tokens.generateAcessToken(user, tokenSession);
            // Send email with reset tokens
            return {
                message: 'If your email is registered, you will receive a password reset link',
                resetCode: resetToken
            };
        } catch (error) {
         throw new Error(`Failed to process forgot password request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    public async validateOtp(email:string,token:string):Promise<{messeage:string}>{
        try {
            const user  = await authModel.findOne({email:email})
            if(!user) throw new HttpException(404,"Not Found","User doesn't exist")
            const id = user.id
            const verifyOtp = await this.Otp.veriryOtp(id,token)
            if(verifyOtp === true){
                 throw new HttpException(400, "otp_expired", "OTP Code expired or invalid");
            } 
        //    const tokenSession = tokens.generateSessionId();
        //    const  refreshSession = tokens.generateSessionId();  
        //    const accessToken = tokens.generateAcessToken(user,tokenSession);
        //    const refreshToken = tokens.generaterefreshToken(user,refreshSession); 

           return {messeage:"User OTP Code has been validated  you can now reset your password"};

        } catch (error) {
            throw new HttpException(400,"failed",`Failed to validate OTP ${error}`)
        }
    }

    public async resetPassword(auth:TokenPayload  ,password:string):Promise<{accessToken:string,refreshToken:string}>{
       try {
            const email = auth.email;
            const user = await authModel.findOne({email:email});
            if(!user) throw new HttpException(404,"Not found","User not found");
            
            const tokenSession = tokens.generateSessionId();
            const refreshSession = tokens.generateSessionId();
            const accessToken = tokens.generateAcessToken(user,tokenSession)
            const refreshToken = tokens.generaterefreshToken(user,refreshSession);

            user.sessionToken = accessToken;
            user.refreshToken = refreshToken;
            user.password = password;
            await user.save();
           
            return{accessToken,refreshToken}
       } catch (error) {
         throw new HttpException(400,"failed",`Failed to reset password ${error}`)
       }
    }
    public async logout(auth:TokenPayload):Promise<void>{
        try {
            const result = await authModel.findByIdAndUpdate(
                auth?.id,
                {
                    $unset: {
                        sessionToken: "",
                        refreshToken: ""
                    }
                },
                {new: true}
            );
            if(!result) throw new HttpException(404,"User not found","Login failed");
            await result.save()
        } catch (error) {
            throw new HttpException(400,"failed",`User logout failed ${error}` )
        }
    }
}

export default AuthService;