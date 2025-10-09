import { Schema,model } from "mongoose";
import { WatchList } from "./watch-list.interface";



const watchListSchema = new Schema<WatchList>({
    user: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Products", required: true },
    createdAt: { type: Date, default: Date.now }
})

watchListSchema.index({ user: 1, product: 1 }, { unique: true }); 


export default model<WatchList>("WatchList",watchListSchema)