import { Schema,model,Types } from "mongoose";
import { IInventory } from "./inventory.interface";
import { IUnit } from "../resources/products/product.interface";

const inventorySchema = new Schema<IInventory>({
    userId: { type: Types.ObjectId, ref: "Auth", required: true },
    productId: { type: Types.ObjectId, ref: "Products", required: true },
    quantity: { type: Number, required: true },
    unit:{
    type:String,
    enum :Object.values(IUnit),
    required:true
  },
    preferredMarket: { type: Types.ObjectId, ref: "Markets" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

inventorySchema.index({ userId: 1 });


export default model<IInventory>("Inventory",inventorySchema)



