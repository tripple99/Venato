import { Document, Types } from "mongoose";


export interface IAlert extends Document{
    productId: Types.ObjectId;
    targetValue: number;
    condition: "equal" | "above" | "below" | "change_pct";
    currency: string;
    user: Types.ObjectId;
    market: Types.ObjectId;
    cooldownMinutes?: number;
    lastTriggeredAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

