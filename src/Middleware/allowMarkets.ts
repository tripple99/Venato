import mongoose from "mongoose";
import { Request,Response,NextFunction } from "express";
import authModel from "../resources/auths/auth.model";
import {AllowedMarkets} from "../resources/auths/auth.interface";
import { TokenPayload } from "../Middleware/auths";
import HttpException from "../exceptions/http.exception";
import { AuthRole } from "../resources/auths/auth.interface";
import marketModel from "../resources/markets/market.model";

export interface IMarket {
    allowedMarket: string;
    // Add other properties of your market document here
    _id: mongoose.Types.ObjectId;
}


declare global {
  namespace Express{
    interface Request{
      user?:TokenPayload,
      markets?:string
    }
  }
}



const allowedMarket = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
   try {
       if(!req.user)throw new HttpException(401,"Unauthorized Access","Authentication required");
       const user = await authModel.findOne({email:req.user.email});
       if(user?.userRole !== AuthRole.Admin)  throw new HttpException(401,"Unauthorized Access",`User doesn't have the required role : ${AuthRole.Admin}`);
       if(!user?.allowedMarkets) throw new HttpException(404,"Not found","User has no assigned market");
      //  const collection =  mongoose.connection.collection("markets");
       const market = await marketModel.findOne({name:user.allowedMarkets}).lean();
       if(!market) throw new HttpException(404,"Not found","User market not found");
       const marketId = market._id;
       req.markets = marketId.toString(); 
       next();
   } catch (error) {
     throw new HttpException(404,"failed",`User doesn't have access to this market`)
   }
}  

export default allowedMarket;