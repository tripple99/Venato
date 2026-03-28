import { Document } from "mongoose"; 
import { Types } from "mongoose";


export enum AuthRole{
    User = "user",
    Admin = "admin",
    superAdmin = "superadmin" 
}

export enum AllowedMarkets{
    Default = '',
    Charanchi = "Charanchi",
    Ajiwa = "Ajiwa",
    Dawanau = "Dawanau",
}

export enum OauthProvider{
    Google = "google",
    Twitter = "twitter",
    Facebook = "facebook"

}

  
export interface IAuth extends Document{
    fullname:string,
    email:string,
    password:string,
    userRole:AuthRole,
    allowedMarkets:Types.ObjectId[],
    sessionToken:string | null,
    refreshToken:string,
    createdAt:Date,
    updatedAt:Date,
    isValidPassword(password:string):Promise <Error | boolean>,
    isActive?: boolean;
    lastActive?: Date;
    isVerified?:boolean;
}