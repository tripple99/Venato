import { Schema, model } from "mongoose";
import { INotification, NotificationType, NotificationStatus } from "./notification.interface";

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes for faster queries
NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });

export default model<INotification>("Notification", NotificationSchema);
