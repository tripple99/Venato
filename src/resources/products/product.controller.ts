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
     this.router.get('/',[authenticate,authorize([AuthRole.Admin])],this.fetchProducts)
     this.router.get("/:id",[authenticate,authorize([AuthRole.Admin])],this.fetchProductById)
     this.router.post("/",[authenticate,authorize([AuthRole.Admin]),allowedMarket('body')],schemaValidator(validator.createProduct),this.createProduct)
     this.router.patch("/:id",[authenticate,authorize([AuthRole.Admin]),allowedMarket('body')],schemaValidator(validator.updateProduct),this.updateProduct);
     this.router.delete("/:id/:marketId",[authenticate,authorize([AuthRole.Admin]),allowedMarket('params')],this.deleteProduct)
   }

 
   private createProduct = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
      try {
        const data = {
           ...req.body,
           createdBy: req.user?.id,
           updatedBy: req.user?.id
        };
        const createProduct = await this.Productservice.create(data)
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
      const fetch = await this.Productservice.getProducts(req.markets,req.query)
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
        const product = await this.Productservice.fetchProductById(req.params.id);
        
        // Permission check: ensure product's market is in user's allowed markets
        const allowed = req.markets?.some(m => m.toString() === product.market.toString());
        if (!allowed) {
            throw new HttpException(403, "Forbidden", "You do not have permission to view this product's market");
        }

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
       
         const data = await this.Productservice.update(req.params.id,req.body)
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
        //  const market = req.markets
        const data = await this.Productservice.delete(req.params.id);
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