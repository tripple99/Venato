import {Request,Response,NextFunction, Router} from "express";
import AuthService from "./market.service"
import { AuthRole } from "../auths/auth.interface";
import { authenticate,authorize } from "../../Middleware/auths";
import GlobalController from "../../controllers/globalControllers";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validator from './market.validator'


class MarketController implements GlobalController{
   public path = "markets"
   public router =  Router();
   public marketService = new AuthService();
   
   constructor(){
     this.intiailizedRoutes();
   }

   private intiailizedRoutes():void{
      this.router.get("/public",this.fetchAllPublic);
      this.router.get('/',[authenticate,authorize([AuthRole.superAdmin])],this.fetchAllMarket)
      this.router.get('/:id',[authenticate,authorize([AuthRole.superAdmin])],this.fetchById)
      this.router.post("/",[authenticate,authorize([AuthRole.superAdmin])],schemaValidator(validator.createMarket),this.createMarket);
      this.router.patch("/:id",[authenticate,authorize([AuthRole.superAdmin])],schemaValidator(validator.createMarket),this.updateMarket);
      this.router.delete("/:id",[authenticate,authorize([AuthRole.superAdmin])],this.deleteMarket);
   } 
    

   private createMarket = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
      
        const market = await this.marketService.create(req.body)
        res.status(201).json({
          status:"Success",
          message:"Market created successfully",
          payload:market  
        })
      } catch (error) {
        next(error);
      }
   }
   private updateMarket = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
    
      const market = await this.marketService.update(req.params.id,req.body)
      res.status(201).json({
        status:"Success",
        message:"Market updated successfully",
        payload:market  
      })
    } catch (error) {
      next(error);
    }
 }
 private deleteMarket = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
    
      const market = await this.marketService.delete(req.params.id)
      res.status(201).json({
        status:"Success",
        message:"Market deleted successfully",
        payload:market  
      })
    } catch (error) {
      next(error);
    }
 }
 private fetchAllMarket = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
  try {
    const query = req.query
    const market = await this.marketService.fetchAll(query)
    res.status(200).json({
      status:"Success",
      mmessage:"Market data fetched successfully",
      payload:market
    })
  } catch (error) {
    next(error)
  }
 }
 private fetchAllPublic = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
  try {
    const query = req.query
    const market = await this.marketService.fetchAllPublic(query)
    res.status(200).json({
      status:"Success",
      mmessage:"Market data fetched successfully",
      payload:market
    })
  } catch (error) {
    next(error)
  }
 }
 private fetchById = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
   try {
     const market = await this.marketService.fetchById(req.params.id)
       res.status(200).json({
      status:"Success",
      mmessage:"Market data fetched successfully",
      payload:market
    })
   } catch (error) {
    next(error)
   }
 }
}
export default MarketController



