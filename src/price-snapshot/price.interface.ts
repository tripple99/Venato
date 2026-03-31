import { Document, Types,Schema } from 'mongoose';


export enum Source {
  Updated = 'Updated',
  Created = 'Created',
  Deleted = 'Deleted',
}



export interface IPriceSnapshot extends Document {
  productId: Types.ObjectId;
  marketId: Types.ObjectId;
  price: number;
  timestamp: Date;
  source:Source;
}

export interface IPriceSnapshotCreate {
  productId: Types.ObjectId;
  marketId: Types.ObjectId;
  price: number;
  source:Source;
  timestamp?: Date;
}