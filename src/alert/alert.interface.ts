import { Document, Types } from "mongoose";


export interface IAlert extends Document{
    productId: Types.ObjectId;
    price:number;
    currency:string;
    product:Types.ObjectId;
    user:Types.ObjectId;
    market:Types.ObjectId;
    createdAt:Date;
    updatedAt:Date;
    
}