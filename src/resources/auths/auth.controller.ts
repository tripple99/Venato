import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import GlobalController from "../../controllers/globalControllers";
import AuthService from "./auth.service";
import { authenticate, authorize, TokenPayload } from "../../Middleware/auths";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validator from "./auth.validation";
import authModel from "./auth.model";
import rateLimit from "express-rate-limit";

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Limit each IP to 10 requests per windowMs for sensitive routes
    message: "Too many authentication attempts, please try again later"
  });
class AuthControllers implements GlobalController{
     public path = 'auth';
     public router = Router()
     private authService = new AuthService();
     
     constructor(){
      this.initializeRoutes();
     }
     private initializeRoutes():void{
        this.router.post('/',schemaValidator(validator.register),authLimiter,this.register),
        this.router.post('/login',schemaValidator(validator.login),authLimiter,this.login),
        this.router.post('/refresh',schemaValidator(validator.refreshToken),this.refreshToken),
        this.router.post('/logout',authenticate,this.logout),
        this.router.post("/forgot-password",schemaValidator(validator.forgotPassword),this.forgotPassword)
        this.router.post("/validate-Otp",schemaValidator(validator.validateOtp),this.validateOtp)
        this.router.patch("/reset-password",schemaValidator(validator.updatePassword),authLimiter,this.resetPassword)
        this.router.post("/resend-otp",schemaValidator(validator.resendOtp),authLimiter,this.resendOtp)
     }

     private register = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
        try {
            const ipAddress = req.ip;
            const userAgent = req.get("User-Agent");
            const {accessToken,refreshToken} = await this.authService.register(req.body,ipAddress,userAgent);
            res.status(200).json({
                status:"Success",
                message:"User Registered Successfully",
                payload:{accessToken,refreshToken}
            }) 
        } catch (error) {
          next(error)            
        }
     } 
     private login = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
          const {email,password} = req.body; 
          const ipAddress = req.ip;
          const userAgent = req.get("User-Agent");      
          const {accessToken,refreshToken} = await this.authService.login(email, password, ipAddress, userAgent);
          res.status(200).json({
              status:"Success",
              message:"User Logged in Successfully",
              payload:{accessToken,refreshToken}
          }) 
      } catch (error) {
          next(error)     
      }
   } 

   private refreshToken = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {refreshToken} = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        if(!refreshToken) throw new HttpException(404,"failed","Token not found")
        const result = await this.authService.refreshToken(refreshToken, ipAddress, userAgent);
        res.status(200).json({
            status:"Success",
            message:"Token refreshed successfully",
            payload:result
        })
    } catch (error) {
        next(error)
    }
   }
   private forgotPassword = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {email} = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        const user = await authModel.findOne({ email: email });
     
        const data = await this.authService.forgotPassword(email, ipAddress, userAgent);
        res.status(200).json({
          status:user?true:false,
          message:data.message,
        })
    } catch (error) {
        next(error)
    }
   }

   private  resendOtp = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {email,purpose} = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        const data = await this.authService.sendOtp(email, purpose, ipAddress, userAgent);
        res.status(200).json({
          status:"Success",
          message:"Otp has been successfully sent",
          payload:data
        })
    } catch (error) {
        next(error)
    }
   }
   private validateOtp = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {email,otp,purpose} = req.body
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        const result = await this.authService.validateOtp(email, otp, purpose, ipAddress, userAgent);
        res.status(200).json({
            status:"Success",
            message:"Opt has been successfully validated",
            payload:result
        })
    } catch (error) {
        next(error)
    }
   }
   private resetPassword = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const{password,resetToken} = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        // if (!req.user) throw new HttpException(401, "error", "Unauthorized - user not found");
        const result = await this.authService.resetPassword(password, resetToken, ipAddress, userAgent);
        res.status(201).json({
            status:"Success",
            message:"User password has been successfully reseted",
            payload:result
        })
    } catch (error) {
        next(error)
    }
   }
   private logout = async(req:Request,res:Response,next:NextFunction)=>{
     try {
        const token = req.user;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");
        if(!token) throw new HttpException(404,"fialed","Token not found")
        await this.authService.logout(token as TokenPayload, ipAddress, userAgent)
        res.status(200).json({status: "success", message: "Logout successful", payload:req.user});
     } catch (error) {
        next(error)
     }
   }
}

export default AuthControllers