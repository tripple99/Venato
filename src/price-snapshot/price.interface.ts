import { Document, Types,Schema } from 'mongoose';



export interface IPriceSnapshot extends Document {
  productId: Types.ObjectId;
  marketId: Types.ObjectId;
  price: number;
  timestamp: Date;
}

export interface IPriceSnapshotCreate {
  productId: Types.ObjectId;
  marketId: Types.ObjectId;
  price: number;
  timestamp?: Date;
}