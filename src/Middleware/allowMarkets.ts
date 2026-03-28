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
      markets?:string[],
    }
  }
}



const allowedMarket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Ensure user is authenticated (should be handled by 'authenticate' middleware)
        if (!req.user) {
            return next(new HttpException(401, "Unauthenticated", "No user found in request"));
        }

        // 2. Role Check: Only Admins are subject to market-scoping
        // (Super Admins usually bypass this or have their own logic)
        if (req.user.userRole !== AuthRole.Admin) {
            return next(new HttpException(403, "Forbidden", "Access restricted to Administrators"));
        }

        // 3. Extract the market the user is trying to access
        const targetMarketId = req.body.marketId || req.params.marketId || req.query.marketId;

        if (!targetMarketId) {
            return next(new HttpException(400, "Bad Request", "Market ID is required for this operation"));
        }

        // 4. Permission Check: Compare target to user's allowedMarkets array
        // We use .some() and .toString() to ensure ObjectId comparison works correctly
        const hasAccess = req.user.allowedMarkets.some(
            (id: any) => id.toString() === targetMarketId.toString()
        );

        if (!hasAccess) {
            return next(new HttpException(403, "Forbidden", "You do not have permission to manage this market"));
        }

        // 5. Attach allowed markets to request for use in downstream controllers
        req.markets = req.user.allowedMarkets; 
        
        next();
    } catch (error) {
        next(new HttpException(500, "Internal Server Error", "Error verifying market access"));
    }
};

export default allowedMarket;