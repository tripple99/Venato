import { Document, Types } from "mongoose";

export enum NotificationType {
  SYSTEM = "SYSTEM",
  ALERT = "ALERT",
  PROMO = "PROMO",
  MARKET = "MARKET",
  PRICE_CHANGE = "PRICE_CHANGE"
}

export enum NotificationStatus {
  UNREAD = "UNREAD",
  READ = "READ"
}

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
