import mongoose, { Model,Query } from "mongoose";
import {model,Schema} from 'mongoose'
import { Market,ILocation,IMarketData} from "./market.interface";

const locationSchema = new Schema<ILocation>({
   state:{type:String,required:true},
   code:{type:String,required:true},
   LGA:{type:String,required:true},
   cordinates:{
    longitude:{type:String, unique:false },
     latitude:{type:String, unique:false },
 
   }
},{ _id: false })


const marketSchema = new Schema<IMarketData>({
    name:{type:String,required:true,unique:true},
    currency:{type:String,required:true},
    location:{type:locationSchema,required:true},
    isActive:{type:Boolean,default:true},
    isDeleted:{type:Boolean,default:false},
    createdAt:{type:Date,default:Date.now},
    updatedAt:{type:Date,default:Date.now},

})

// marketSchema.pre("findOneAndUpdate",function(next){
//   this.where({ isActive: true,isDeleted:false }); // 'this' correctly points to the Mongoose Query
//   next();
// })

// marketSchema.pre("find",function(next){
//   this.where({ isActive: true,isDeleted:false }); // 'this' correctly points to the Mongoose Query
//   next();
// })

// marketSchema.pre("findOne",function(next){
//   this.where({ isActive: true,isDeleted:false }); // 'this' correctly points to the Mongoose Query
//   next();
// })




// marketSchema.pre(/^find/, function(this:Query<any,any>,next) {
//   this.where({ isActive: true,isDeleted:false }); // 'this' correctly points to the Mongoose Query
//   next();
// });


export default model<IMarketData>("Markets",marketSchema)