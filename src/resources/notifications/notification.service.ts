import HttpException from "../../exceptions/http.exception";
import notificationModel from "./notification.model";
import { INotification, NotificationStatus } from "./notification.interface";
import { paginationQuery, buildSortOptions, createPaginatedResult } from "../../utils/pagination";
import { PaginationResult } from "../../interface/pagination.interface";

class NotificationService {
  
  public async getUserNotifications(
    userId: string,
    query: any = {}
  ): Promise<PaginationResult<INotification>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(pagination.sortBy || "createdAt", pagination.sortOrder || "desc");
      
      const filter: any = { recipientId: userId };
      
      if (query.status) {
        filter.status = query.status;
      }
      
      if (query.type) {
        filter.type = query.type;
      }

      const [notifications, totalCount] = await Promise.all([
        notificationModel
          .find(filter)
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit),
        notificationModel.countDocuments(filter).lean(),
      ]);

      return createPaginatedResult(
        notifications,
        totalCount,
        pagination.page,
        pagination.limit
      );
    } catch (error) {
      throw new HttpException(400, "Failed", "Failed to fetch notifications");
    }
  }

  public async getUnreadCount(userId: string): Promise<number> {
    try {
      return await notificationModel.countDocuments({
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      });
    } catch (error) {
      throw new HttpException(400, "Failed", "Failed to get unread count");
    }
  }

  public async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    try {
      const notification = await notificationModel.findOneAndUpdate(
        { _id: notificationId, recipientId: userId },
        { status: NotificationStatus.READ },
        { new: true }
      );
      
      if (!notification) {
        throw new HttpException(404, "Not Found", "Notification not found");
      }
      
      return notification;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(400, "Failed", "Failed to mark notification as read");
    }
  }

  public async markAllAsRead(userId: string): Promise<void> {
    try {
      await notificationModel.updateMany(
        { recipientId: userId, status: NotificationStatus.UNREAD },
        { status: NotificationStatus.READ }
      );
    } catch (error) {
      throw new HttpException(400, "Failed", "Failed to mark all as read");
    }
  }

  public async createNotification(data: Partial<INotification>): Promise<INotification> {
    try {
      const notification = await notificationModel.create(data);
      return notification;
    } catch (error) {
      throw new HttpException(400, "Failed", "Failed to create notification");
    }
  }
}

export default NotificationService;
