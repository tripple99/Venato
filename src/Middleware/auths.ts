import {Request,Response,NextFunction} from "express";
import HttpException from "../exceptions/http.exception";
import jwt from "jsonwebtoken"
import authModel from "../resources/auths/auth.model"; // added import

export interface TokenPayload {
    id: string;
    userRole: string;
    email: string;
    fullname: string;
    accessToken: string;
    refreshToken: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticate = async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    const bearerToken = req.headers.authorization;
    if(!bearerToken || !bearerToken.startsWith('Bearer ')){
        throw new HttpException(401,'error',"Unauthorized -tokeen not provided")
    }
    const token = bearerToken.split('Bearer ')[1].trim();
    let payload:TokenPayload; 
    try {
      payload = jwt.verify(token ,process.env.ACCESS_TOKEN as jwt.Secret) as TokenPayload
      req.user = payload 

      // update activity on each authenticated request
      try {
        await authModel.findByIdAndUpdate(payload.id, {
          $set: { isActive: true, lastActive: new Date() }
        }).lean();
      } catch (e) {
        // non-fatal — continue request even if DB update fails
        console.warn('Failed to update lastActive', e);
      }

      next()
    } catch (error) {
        throw new HttpException(500,'error',`server error ${error}` )
    }
}

export const authorize = (roles?:string[])=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        authenticate(req,res,()=>{
             if(!req.user){
                throw new HttpException(401,'error',"Unauthorized access ❌❌")
             }
             if(roles && roles.length > 0){
                
                const userRole  = req.user.userRole.toLowerCase();
                const hasRequiredRole = roles.some(role =>
                    role.toLowerCase() === userRole
                ); 
               
                
                if (!hasRequiredRole) {
                    return next(new HttpException(403, 'error',
                        `Forbidden - You do not have the required role. You have ${req.user.userRole} but need one of ${roles.join(', ')}`
                    ));
                }
             }
          return next();
        })
    }
}