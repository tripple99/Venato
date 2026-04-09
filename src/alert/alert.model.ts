import { Schema, model } from "mongoose";
import { IAlert } from "./alert.interface";

const alertSchema = new Schema<IAlert>({
    targetValue: { type: Number, required: true },
    condition: { type: String, enum: ["equal", "above", "below", "change_pct"], default: "equal" },
    currency: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Products", required: true },
    user: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    market: { type: Schema.Types.ObjectId, ref: "Markets", required: true },
    cooldownMinutes: { type: Number },
    lastTriggeredAt: { type: Date },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

 alertSchema.index({ user: 1, productId: 1 });

 
export default model<IAlert>("Alert", alertSchema); 