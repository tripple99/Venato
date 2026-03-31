import mongoose, { Model } from "mongoose";
import {model,Schema} from 'mongoose'
import { Market,ILocation,IMarketData,LgaCode,LGA} from "./market.interface";

const locationSchema = new Schema<ILocation>({
   state:{type:String,required:true},
   code:{type:String,required:true,enum:Object.values(LgaCode)},
   LGA:{type:String,required:true,enum:Object.values(LGA)},
   cordinates:{
    longitude:{type:String, unique:false },
     latitude:{type:String, unique:false },
 
   }
})


const marketSchema = new Schema<IMarketData>({
    name:{type:String,required:true,unique:true},
    currency:{type:String,required:true},
    location:{type:locationSchema,required:true},

})

   

export default model<IMarketData>("Markets",marketSchema)