import { Request,Response,NextFunction, Router } from "express";
import GlobalControllers from "../../controllers/globalControllers";
import AccessControlService from "./access-control.service";
import { authenticate,authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validate from './access-control.validator'




class AccessController implements GlobalControllers{
  public path = "access";
  public router =  Router();
  private accessService = new AccessControlService()

  constructor(){
    this.initializeController();
  }

  private initializeController():void{
     this.router.put('/:id',[authenticate,authorize([AuthRole.superAdmin])],schemaValidator(validate.grantAccess),this.grantUserAccess)
     this.router.put('/revoke/:id',[authenticate,authorize([AuthRole.superAdmin])],schemaValidator(validate.grantAccess),this.revokeUserAccess)   
  }

  private grantUserAccess = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
     try {
      const grant = await this.accessService.grantAccess(req.params.id,req.body);
      res.status(200).json({
         status:"Successful",
         message:"User role and Market successfully created",
         payload:grant
      })
     } catch (error) {
      next(error)
     }
  } 
  private revokeUserAccess = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
       const revoke = await this.accessService.revokeAccess(req.params.id);
       res.status(200).json({
         status:"Success",
         message:"User Access revoke successfully",
         payload:revoke
       })
    } catch (error) {
      next(error)
    }
  }
}

export default AccessController;