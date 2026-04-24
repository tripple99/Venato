import { Document, Schema } from "mongoose";
import { IUnit } from "../products/product.interface";

/**
 * Interface representing the Inventory model for the Venato platform.
 * This links a user's stock to specific products and market prices.
 */
export interface IInventory extends Document {
  userId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  quantity: number;
  unit: IUnit;
  preferredMarket?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
