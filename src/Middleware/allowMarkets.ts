import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import authModel from "../resources/auths/auth.model";
import logger from "../utils/logger";

import { AllowedMarkets } from "../resources/auths/auth.interface";
import { TokenPayload } from "../Middleware/auths";
import HttpException from "../exceptions/http.exception";
import { AuthRole } from "../resources/auths/auth.interface";
import marketModel from "../resources/markets/market.model";

declare global {
  namespace Express {
    interface Request {
      markets?: string[];
    }
  }
}

const allowedMarket = (source: "params" | "body" | "query") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Authenticated check (Security Layer)
      if (!req.user) {
        return next(new HttpException(401, "Unauthenticated", "No user found"));
      }

      // 2. Role Check (Authorization Layer)
      if (req.user.userRole !== AuthRole.Admin) {
        return next(new HttpException(403, "Forbidden", "Admin access required"));
      }

      // 3. Extract the market ID
      // Fallback: Check for 'id' if 'marketId' is missing, but 'marketId' is preferred
      const targetMarketId = req[source]?.marketId || req[source]?.id;

      if (!targetMarketId) {
        return next(new HttpException(400, "Bad Request", `Market identification missing in ${source}`));
      }

      // 4. Permission Check
      const allowedMarkets = req.user.allowedMarkets || [];
      
      const hasAccess = allowedMarkets.some(
        (id: any) => id && id.toString() === targetMarketId.toString()
      );

      if (!hasAccess) {
        return next(new HttpException(403, "Forbidden", "You do not have permission for this market"));
      }

      // 5. Contextual Data Injection
      req.markets = allowedMarkets;
      
      next();
    } catch (error: any) {
      logger.error("CRITICAL: allowedMarket Middleware Error ->", { error: error.message, stack: error.stack });
      next(new HttpException(500, "Internal Server Error", "Error verifying market access"));
    }
  };
};

export default allowedMarket;
