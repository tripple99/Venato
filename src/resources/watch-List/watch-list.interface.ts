import { Types,Document } from "mongoose";
import { IUnit,ICategory } from "../products/product.interface";

export interface WatchList extends Document{
  user:Types.ObjectId
  product:Types.ObjectId
  // market:Types.ObjectId
  createdAt: Date;
  updatedAt: Date;
}

