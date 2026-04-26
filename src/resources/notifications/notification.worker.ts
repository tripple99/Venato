import { agenda } from "../../helpers/agenda";
import { Job } from "agenda";
import notificationModel from "./notification.model";
import authModel from "../auths/auth.model";
import watchListModel from "../watch-List/watch-list.model";
import { NotificationType, NotificationStatus } from "./notification.interface";
import logger from "../../utils/logger";
import mongoose from "mongoose";

// --- Job Definitions ---

// 1. Process a single general notification
agenda.define("process-notification", async (job: Job) => {
  try {
    const { recipientId, title, message, type, metadata } = job.attrs.data;
    await notificationModel.create({
      recipientId,
      title,
      message,
      type,
      metadata,
      status: NotificationStatus.UNREAD,
    });
  } catch (error: any) {
    logger.error(`[QUEUE ERROR] process-notification failed: ${error.message}`, { error });
  }
});

// 2. Notify users watching a product about price change
agenda.define("notify-price-change", async (job: Job) => {
  try {
    const { productId, newPrice, productName } = job.attrs.data;
    
    // Find all users watching this product
    const watchListItems = await watchListModel.find({ product: productId }).lean();
    
    if (!watchListItems || watchListItems.length === 0) return;

    // Create notifications in bulk for efficiency
    const notifications = watchListItems.map(item => ({
      recipientId: item.user,
      title: "Price Alert: Product Update",
      message: `The price of ${productName} has been updated to ${newPrice}.`,
      type: NotificationType.PRICE_CHANGE,
      metadata: { productId, newPrice },
      status: NotificationStatus.UNREAD,
    }));

    if (notifications.length > 0) {
      await notificationModel.insertMany(notifications);
    }
  } catch (error: any) {
    logger.error(`[QUEUE ERROR] notify-price-change failed: ${error.message}`, { error });
  }
});

// 3. Notify all active users about a new market
agenda.define("notify-new-market", async (job: Job) => {
  try {
    const { marketName, marketId, location } = job.attrs.data;
    
    // Find all active users. Depending on scale, we might need to batch this.
    // Let's fetch all verified users instead of just isActive to ensure test users receive it
    const activeUsers = await authModel.find({ isVerified: true }).select("_id").lean();
    
    if (!activeUsers || activeUsers.length === 0) return;

    const notifications = activeUsers.map(user => ({
      recipientId: user._id,
      title: "New Market Added!",
      message: `A new market "${marketName}" has just been added in ${location || 'your area'}. Check it out!`,
      type: NotificationType.MARKET,
      metadata: { marketId },
      status: NotificationStatus.UNREAD,
    }));

    if (notifications.length > 0) {
      await notificationModel.insertMany(notifications);
    }
  } catch (error: any) {
    logger.error(`[QUEUE ERROR] notify-new-market failed: ${error.message}`, { error });
  }
});

// 4. Notify users when a market is deleted
agenda.define("notify-market-deleted", async (job: Job) => {
  try {
    const { marketName } = job.attrs.data;
    
    // Notify all verified users
    const users = await authModel.find({ isVerified: true }).select("_id").lean();
    
    if (!users || users.length === 0) return;

    const notifications = users.map(user => ({
      recipientId: user._id,
      title: "Market Removed",
      message: `The market "${marketName}" has been removed from our platform.`,
      type: NotificationType.MARKET,
      status: NotificationStatus.UNREAD,
    }));

    if (notifications.length > 0) {
      await notificationModel.insertMany(notifications);
    }
  } catch (error: any) {
    logger.error(`[QUEUE ERROR] notify-market-deleted failed: ${error.message}`, { error });
  }
});


// --- Queue Service ---

class NotificationQueueService {
  private agenda = agenda;

  public async sendNotification(
    recipientId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: Record<string, any>
  ) {
    try {
      await this.agenda.now("process-notification", {
        recipientId,
        title,
        message,
        type,
        metadata,
      });
    } catch (error) {
      logger.error("Failed to queue notification", { error });
    }
  }

  public async queuePriceChangeNotification(
    productId: string | mongoose.Types.ObjectId,
    newPrice: number,
    productName: string
  ) {
    try {
      await this.agenda.now("notify-price-change", {
        productId,
        newPrice,
        productName,
      });
    } catch (error) {
      logger.error("Failed to queue price change notification", { error });
    }
  }

  public async queueNewMarketNotification(
    marketId: string | mongoose.Types.ObjectId,
    marketName: string,
    location?: string
  ) {
    try {
      await this.agenda.now("notify-new-market", {
        marketId,
        marketName,
        location,
      });
    } catch (error) {
      logger.error("Failed to queue new market notification", { error });
    }
  }

  public async queueMarketDeletedNotification(marketName: string) {
    try {
      await this.agenda.now("notify-market-deleted", { marketName });
    } catch (error) {
      logger.error("Failed to queue market deleted notification", { error });
    }
  }

  public async queueRoleChangedNotification(recipientId: string | mongoose.Types.ObjectId, role: string) {
    try {
      await this.agenda.now("process-notification", {
        recipientId,
        title: "Role Updated",
        message: `Your account role has been updated to: ${role}`,
        type: NotificationType.ACCESS,
        metadata: { role }
      });
    } catch (error) {
      logger.error("Failed to queue role change notification", { error });
    }
  }

  public async queueMarketAccessNotification(recipientId: string | mongoose.Types.ObjectId, marketName: string, action: 'granted' | 'revoked') {
    try {
      await this.agenda.now("process-notification", {
        recipientId,
        title: action === 'granted' ? "Market Access Granted" : "Market Access Revoked",
        message: action === 'granted' 
          ? `You have been granted access to the ${marketName} market.`
          : `Your access to the ${marketName} market has been revoked.`,
        type: NotificationType.ACCESS,
        metadata: { marketName, action }
      });
    } catch (error) {
      logger.error("Failed to queue market access notification", { error });
    }
  }
}

export default new NotificationQueueService();
