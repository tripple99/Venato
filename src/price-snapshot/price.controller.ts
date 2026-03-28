// import GlobalController from "../controllers/globalControllers";
// import PriceSnapshotService from "./price.service";
// import { Router,Request,Response,NextFunction } from "express";
// import { authenticate } from "../Middleware/auths";
// import schemaValidator from "../Middleware/schema-validation.middlware";
// import priceSnapshotValidators from "./price.validators";


// class PriceSnapshotController implements GlobalController{
//    public path:string = "price-snapshot"
//    public router:Router = Router();
//    private priceSnapshotService:PriceSnapshotService = new PriceSnapshotService();

//    constructor(){
//     this.initializeRoutes();
//    }

//    private initializeRoutes():void{
//     this.router.post('/',[authenticate,schemaValidator(priceSnapshotValidators.create)],this.create);
//     this.router.get('/:id',[authenticate,schemaValidator(priceSnapshotValidators.fetchById)],this.fetchById);
//    }


//    private create = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
//     try {
//         const priceSnapshot = await this.priceSnapshotService.create(req.body);
//         res.status(201).json({
//           status:"Success",
//           message:"Price snapshot created successfully",
//           payload:priceSnapshot
//         });
//     } catch (error) {
//         next(error);
//     }
//    }  

//    private fetchById = async (req:Request,res:Response,next:NextFunction):Promise<void>=>{
//     try {
//         const priceSnapshot = await this.priceSnapshotService.fetch(req.params.id);
//         res.status(200).json({
//           status:"Success",
//           message:"Price snapshot fetched successfully",
//           payload:priceSnapshot
//         });
//     } catch (error) {
//         next(error);
//     }
//    }  
// }