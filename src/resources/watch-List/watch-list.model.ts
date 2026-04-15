import { Schema,model } from "mongoose";
import { WatchList } from "./watch-list.interface";



const watchListSchema = new Schema<WatchList>({
    user: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Products", required: true },
    // market: { type: Schema.Types.ObjectId, ref: "Markets", required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

watchListSchema.index({ user: 1, product: 1 }, { unique: true }); 


export default model<WatchList>("WatchList",watchListSchema)