import { Request,Response,NextFunction, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import WatchListService from "./watch-list.service";
import {authenticate,authorize} from "../../Middleware/auths"
import GlobalControllers from "../../controllers/globalControllers";
import { paginationQuery } from "../../utils/pagination";

class WatchListControllers implements GlobalControllers{
  public path  = "watch-list";
  public router = Router()
  private watchList = new WatchListService();


  constructor(){
   this.intializeController()
  }
  private intializeController():void{
   this.router.post("/:id",authenticate,this.create);
   this.router.get("/",authenticate,this.getAll);
   this.router.delete("/:id",authenticate,this.delete);
  }

  private create = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
       const list = await this.watchList.createList(req.user,req.params.id) 
       res.status(201).json({
        status:"Success",
        message:"Product added to watch list successfully",
        payload:list
       })
    } catch (error) {
      next(error)
    }
  }
  private getAll = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
     try {
       const user = req.user
       if(!user) throw new HttpException(404,"Not found","User not found")
       const pagination = req.query
       const result =await this.watchList.getAll(user.id,pagination);
       res.status(201).json({
        status:"Success",
        message:"All Products listed successfully",
        payload:result
       })
     } catch (error) {
      next(error)
     }
  }
  private delete = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const result = await this.watchList.deleteListById(req.params.id)
      res.status(200).json({
        status:"Success",
        message:"Product deleted successfully",
        payload:result
      })
    } catch (error) {
      next(error)
    }
  }
}


export default WatchListControllers