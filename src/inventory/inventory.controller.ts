import { Request,Response,NextFunction } from "express";
import GlobalController from "../controllers/globalControllers";
import InventoryService from "./inventory.service";
import { authenticate } from "../Middleware/auths";
import { Router } from "express";
import schemaValidator from "../Middleware/schema-validation.middlware";
import inventoryValidators from "./inventory.validators";


class InventoryController implements GlobalController{
   public path:string = "inventory"
   public router:Router = Router();
   private inventoryService:InventoryService = new InventoryService();

   constructor(){
    this.initializeRoutes();
   }

   private initializeRoutes():void{
    this.router.post('/',[authenticate,schemaValidator(inventoryValidators.create)],this.create);
    this.router.patch('/:id',[authenticate,schemaValidator(inventoryValidators.update)],this.update);
    this.router.delete('/:id',[authenticate,schemaValidator(inventoryValidators.deleteInventory)],this.delete);
    this.router.get('/',[authenticate,schemaValidator(inventoryValidators.fetch)],this.fetch);
    this.router.get('/:id',[authenticate,schemaValidator(inventoryValidators.fetchById)],this.fetchById);
   }


   private create = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const inventory = await this.inventoryService.create(req.user.id,req.body);
        res.status(201).json({
          status:"Success",
          message:"Inventory created successfully",
          payload:inventory
        });
    } catch (error) {
        next(error);
    }
   }  

   private update = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const inventory = await this.inventoryService.update(req.user.id,req.params.id,req.body);
        res.status(200).json({
          status:"Success",
          message:"Inventory updated successfully",
          payload:inventory
        });
    } catch (error) {
        next(error);
    }
   }  

   private delete = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const inventory = await this.inventoryService.delete(req.user.id,req.body);
        res.status(200).json({
          status:"Success",
          message:"Inventory deleted successfully",
          payload:inventory
        });
    } catch (error) {
        next(error);
    }
   }  

   private fetch = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const inventory = await this.inventoryService.fetch(req.user.id);
        res.status(200).json({
          status:"Success",
          message:"Inventory fetched successfully",
          payload:inventory
        });
    } catch (error) {
        next(error);
    }
   }  

   private fetchById = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const inventory = await this.inventoryService.fetchById(req.user.id,req.params.id);
        res.status(200).json({
          status:"Success",
          message:"Inventory fetched successfully",
          payload:inventory
        });
    } catch (error) {
        next(error);
    }
   }  
}


export default InventoryController;