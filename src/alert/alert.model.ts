import { Schema, model } from "mongoose";
import { IAlert } from "./alert.interface";

const alertSchema = new Schema<IAlert>({
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    market: { type: Schema.Types.ObjectId, ref: "Market", required: true },
}, { timestamps: true });

 alertSchema.index({ user: 1, product: 1 });

 
export default model<IAlert>("Alert", alertSchema); 