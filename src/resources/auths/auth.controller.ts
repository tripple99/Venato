import { Request, Response, NextFunction, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import GlobalController from "../../controllers/globalControllers";
import AuthService from "./auth.service";
import { authenticate, authorize, TokenPayload } from "../../Middleware/auths";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validator from "./auth.validation";



class AuthControllers implements GlobalController{
     public path = 'auth';
     public router = Router()
     private authService = new AuthService();
     
     constructor(){
      this.initializeRoutes();
     }
     private initializeRoutes():void{
        this.router.post('/',schemaValidator(validator.register),this.register),
        this.router.post('/login',schemaValidator(validator.login),this.login),
        this.router.post('/refresh',schemaValidator(validator.refreshToken),this.refreshToken),
        this.router.get('/logout',authenticate,this.logout),
        this.router.post("/forgot-password",schemaValidator(validator.forgotPassword),this.forgotPassword)
        this.router.post("/validate-Otp",schemaValidator(validator.validateOtp),this.validateOtp)
        this.router.patch("/reset-password",authenticate,schemaValidator(validator.updatePassword),this.resetPassword)
        this.router.post("/resend-otp",schemaValidator(validator.resendOtp),this.resendOtp)
     }

     private register = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
        try {
            
            const {accessToken,refreshToken} = await this.authService.register(req.body);
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
                
          const {accessToken,refreshToken} = await this.authService.login(email,password);
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
        if(!refreshToken) throw new HttpException(404,"failed","Token not found")
        const result = await this.authService.refreshToken(refreshToken);
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
        const data = await this.authService.forgotPassword(email);
        res.status(200).json({
          status:"Success",
          message:"Email send successfully",
          payload:data
        })
    } catch (error) {
        next(error)
    }
   }

   private  resendOtp = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const {email,purpose} = req.body;
        const data = await this.authService.sendOtp(email,purpose);
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
        console.log(req.body)
        const {email,otp,purpose} = req.body
        // console.log(email,otp,purpose)
        const result = await this.authService.validateOtp(email,otp,purpose);
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
        const{password} = req.body;
        if (!req.user) throw new HttpException(401, "error", "Unauthorized - user not found");
        const result = await this.authService.resetPassword(req.user as TokenPayload, password);
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
        if(!token) throw new HttpException(404,"fialed","Token not found")
        await this.authService.logout(token as TokenPayload)
        res.status(200).json({status: "success", message: "Logout successful", payload:req.user});
     } catch (error) {
        next(error)
     }
   }
}

export default AuthControllers