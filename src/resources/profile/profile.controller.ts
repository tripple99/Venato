import { Request,Response,NextFunction, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import GlobalController from "../../controllers/globalControllers";
import { AuthRole } from "../auths/auth.interface";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import ProfileService from "./profile.service";
import validator from './profile.validator'
import {authenticate,authorize} from "../../Middleware/auths"


class ProfileController implements GlobalController{
   public path = "/profile";
   public router = Router();
   private profile = new ProfileService()
   
   constructor(){
     this.intiailizeRoutes()
   }
   private intiailizeRoutes():void{
      this.router.patch("/:id",[authenticate],schemaValidator(validator.updateProfile),this.update)
      this.router.delete("/:id",[authenticate,authorize([AuthRole.superAdmin])],this.delete)
   }

   private update = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const uid = req.params.id
      const result = await this.profile.updateProfile(uid,req.body)
      res.status(200).json({
        status:"Success",
        message:"User update successfull",
        payload:result
      })
    } catch (error) {
      next(error)
    }
   }
   private delete = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const uid = req.params.id;
      const result = await this.profile.deleteProfile(uid);
      res.status(200).json({
         status:"Successfull",
         message:"Profile deleted succesfully",
         payload:result 
      })
    } catch (error) {
      next(error)
    }
   }
}


export default ProfileController