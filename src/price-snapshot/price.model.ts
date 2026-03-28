import { Types,Schema,model } from "mongoose";
import { IPriceSnapshot } from "./price.interface";


const priceSnapshotSchema = new Schema<IPriceSnapshot>({
    productId:{
        type:Schema.Types.ObjectId,
        ref:'Products',
        required:true
    },
    marketId:{
        type:Schema.Types.ObjectId,
        ref:'Markets',
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    timestamp:{
        type:Date,
        default:Date.now
    }
})

priceSnapshotSchema.index({ productId: 1, timestamp: -1 });

export default model<IPriceSnapshot>('PriceSnapshot',priceSnapshotSchema)