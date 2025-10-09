import { Request,Response,NextFunction, Router } from "express";
import ProductService from "./product.service";
import GlobalController from "../../controllers/globalControllers";
import { authenticate,authorize } from "../../Middleware/auths";
import allowedMarket from "../../Middleware/allowMarkets";
import { AuthRole } from "../auths/auth.interface";
import HttpException from "../../exceptions/http.exception";
import schemaValidator from "../../Middleware/schema-validation.middlware"
import validator from './product.validator'



class ProductController implements GlobalController{
   public path = "product"
   public router = Router();
   private Productservice = new ProductService();


   constructor(){
       this.initializedController();
   }


   private initializedController():void{
     this.router.get("/All",this.fetchAll)
     this.router.get("/filter",this.filterProduct) 
     this.router.get('/filter/market/:market',this.filterProductByMarket)
     this.router.get('/',[authenticate,authorize([AuthRole.Admin]),allowedMarket],this.fetchProducts)
     this.router.get("/:id",[authenticate,authorize([AuthRole.Admin]),allowedMarket,this.fetchProductById])
     this.router.post("/",[authenticate,authorize([AuthRole.Admin]),allowedMarket],schemaValidator(validator.createProduct),this.createProduct)
     this.router.patch("/:id",[authenticate,authorize([AuthRole.Admin]),allowedMarket],schemaValidator(validator.updateProduct),this.updateProduct);
     this.router.delete("/:id",[authenticate,authorize([AuthRole.Admin]),allowedMarket],this.deleteProduct)
   }

 
   private createProduct = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
        const market = req.markets;
        if(!market) throw new HttpException(404,"Not found","market id not found")
        const data = req.body;
        const createProduct = await this.Productservice.create(market,data)
        res.status(200).json({
          status:"Sucess",
          message:"Product created successfully",
          payload:createProduct
        })
      } catch (error) {
        next(error)
      }
   }
  private fetchAll = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const products = await this.Productservice.fetchAllProduct();
       res.status(200).json({
        status:"Success",
        message:"Products fetched successfully",
        payload:products
      })
    } catch (error) {
      next(error)
    }
  }
  private filterProduct = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const {price} = req.params; 
      const result = await this.Productservice.fetchProductByPrice(price,req.query)
      res.status(200).json({
        status:"Successful",
        message:"Product fetch successfull",
        payload:result
      })
    } catch (error) {
      next(error)
    }
  }
  private filterProductByMarket = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const {market} = req.params;
      console.log(market);
      const result = await this.Productservice.fetchProductsByMarket(market,req.query);
      res.status(200).json({
        status:"Successfull",
        message:"Product fetch Successfull",
        payload:result
      })
    } catch (error) {
      next(error)
    }
  }

  private  fetchProducts = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
      const fetch = await this.Productservice.getProducts(req.markets)
      res.status(200).json({
        status:"Success",
        message:"Products fetched successfully",
        payload:fetch
      })
    } catch (error) {
      next(error)
    }
  }
  private fetchProductById = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try {
       const product = await this.Productservice.fetchProductById(req.params.id)
         res.status(200).json({
        status:"Success",
        message:"Products fetched successfully",
        payload:product
      })
    } catch (error) {
      next(error)
    }
  }
   private updateProduct = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
        const market = req.markets
         const data = await this.Productservice.update(req.params.id,req.body,market)
         res.status(200).json({
          status:"Success",
          message:"Product updated successfully",
          payload:data
         })
      } catch (error) {
          next(error)    
      }
   }
   private deleteProduct = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
         const market = req.markets
        const data = await this.Productservice.delete(req.params.id,market);
        res.status(200).json({
          status:"Success",
          message:"Product deleted successfully",
          payload:data
        })
      } catch (error) {
        next(error)
      }
   }
}


export default ProductController