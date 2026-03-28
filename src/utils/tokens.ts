import jwt from "jsonwebtoken"
import HttpException from "../exceptions/http.exception"
import { IAuth } from "../resources/auths/auth.interface"
import {v4 as uuidv4} from "uuid"




export const generateSessionId = ()=>{
    return uuidv4();
}


export const generateAcessToken = (user:IAuth,sessionId:string):string=>{
   const jwtSecret = process.env.ACCESS_TOKEN
  if(!jwtSecret) throw new HttpException(404,'not found',"jwt secret not found")
   return jwt.sign(
            {
                fullname:user.fullname,
                email:user.email,
                userRole:user.userRole,
                id:user._id,
                sessionId
            },
            jwtSecret,
           {expiresIn:'1d'}
   )
} 


export const generaterefreshToken = (user:IAuth,sessionId:string):string=>{
    const jwtSecret = process.env.REFRESH_TOKEN
    if(!jwtSecret) throw new HttpException(404,'not found',"jwt secret not found")
     return jwt.sign(
              {
                  fullname:user.fullname,
                  email:user.email,
                  userRole:user.userRole,
                  id:user._id,
                  sessionId
              },
              jwtSecret,
             {expiresIn:'7d'}
     )
}



export const verifyAccessToken = async (token:string):Promise<string | jwt.JwtPayload>=>{
    const jwtSecret = process.env.ACCESS_TOKEN;
    if(!jwtSecret) throw new HttpException(404,'not found',"jwt secret not found")
        
    try {
        const decoded = jwt.verify(token,jwtSecret);
        return decoded
    } catch (error) {
        throw error
    }    
}



export const verifyRefreshToken = async (token:string):Promise<string | jwt.JwtPayload>=>{
    const jwtSecret = process.env.REFRESH_TOKEN;
    if(!jwtSecret) throw new HttpException(404,'not found',"jwt secret not found")

    try {
        const decoded = jwt.verify(token,jwtSecret);
        return decoded
    } catch (error) {
        throw error
    }       
}


export default {
    generateAcessToken,
    generateSessionId,
    generaterefreshToken, 
    verifyAccessToken,
    verifyRefreshToken
}