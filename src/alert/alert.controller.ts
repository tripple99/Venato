import GlobalController from "../controllers/globalControllers";
import alertService from "./alert.service";
import { authenticate } from "../Middleware/auths";
import { Router,Request,Response,NextFunction } from "express";
import schemaValidator from "../Middleware/schema-validation.middlware";
import alertValidators from "./alert.validators";
import AlertService from "./alert.service";
import MarketService from "../resources/markets/market.service";
import HttpException from "../exceptions/http.exception";
class AlertController implements GlobalController{
  public  path: string = "/alerts";
  public  router: Router = Router();
  private alertService = new AlertService();
  private marketService = new MarketService();

  constructor(){
    this.intiailizedRoutes();
  }


  private intiailizedRoutes():void{
    this.router.post(this.path,[authenticate,schemaValidator(alertValidators.create)],this.createAlert);
    this.router.get(this.path,[authenticate],this.getAlerts);
    this.router.get(this.path + "/:id",[authenticate],this.getAlertById);
    this.router.patch(this.path + "/:id",[authenticate,schemaValidator(alertValidators.updateAlert)],this.updateAlert);
    this.router.delete(this.path + "/:id",[authenticate],this.deleteAlert);
  }


  createAlert = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const {productId,price,condition,marketId} = req.body
      const market = await this.marketService.fetchById(marketId);
      if(!market) throw new HttpException(404,"Not found","market not found")
      const alert = await this.alertService.createAlert(req.body);
      res.status(201).json({
        status:"success",
        message:"Alert created successfully",
        payload:alert
      })
    } catch (error) {
      next(error);
    }
  }

  getAlerts = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const alerts = await this.alertService.getAlerts();
      res.status(200).json({
        status:"success",
        message:"Alerts fetched successfully",
        payload:alerts
      })
    } catch (error) {
      next(error);
    }
  }

  getAlertById = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const alert = await this.alertService.getAlertById(req.params.id);
      res.status(200).json({
        status:"success",
        message:"Alert fetched successfully",
        payload:alert
      })
    } catch (error) {
      next(error);
    }
  }

  updateAlert = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const alert = await this.alertService.updateAlert(req.params.id,req.body);
      res.status(200).json({
        status:"success",
        message:"Alert updated successfully",
        payload:alert
      })
    } catch (error) {
      next(error);
    }
  }

  deleteAlert = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const alert = await this.alertService.deleteAlert(req.params.id);
      res.status(200).json({
        status:"success",
        message:"Alert deleted successfully",
        payload:alert
      })
    } catch (error) {
      next(error);
    }
  }
    
}

export default AlertController