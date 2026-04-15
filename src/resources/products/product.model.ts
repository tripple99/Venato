import mongoose from "mongoose";
import {model,Schema} from "mongoose"
import { IMarketProduct,IUnit,ICategory} from "./product.interface";




const productSchema = new Schema<IMarketProduct>({
  name:{type:String,required:true},
  price:{type:Number,required:true},
  unit:{
    type:String,
    enum :Object.values(IUnit),
    required:true
  },
  category:{
    type:String,
    enum:Object.values(ICategory),
    required:true,
  },
   market: {
    type: Schema.Types.ObjectId,
    ref: 'Markets',
    required: true
  },
  // priceHistory:[
  //   {
  //     amount:Number,
  //     date:{type:Date,default:Date.now}
  //   }
  // ],
  createdBy:{
    type:Schema.Types.ObjectId,
    ref:'Auth',
    required:true
  },
  updatedBy:{
    type:Schema.Types.ObjectId,
    ref:'Auth',
    required:true
  }
}, { timestamps: true })

productSchema.index({ name: 1, market: 1 }, { unique: true });

export default model<IMarketProduct>("Products",productSchema);