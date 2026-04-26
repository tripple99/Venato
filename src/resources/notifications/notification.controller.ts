import { Request, Response, NextFunction, Router } from "express";
import GlobalController from "../../controllers/globalControllers";
import { authenticate } from "../../Middleware/auths";
import NotificationService from "./notification.service";

class NotificationController implements GlobalController {
  public path = "notifications";
  public router = Router();
  private notificationService = new NotificationService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      authenticate,
      this.getUserNotifications
    );
    this.router.get(
      "/unread-count",
      authenticate,
      this.getUnreadCount
    );
    this.router.post(
      "/",
      authenticate,
      this.createNotification
    );
    this.router.patch(
      "/:id/read",
      authenticate,
      this.markAsRead
    );
    this.router.patch(
      "/read-all",
      authenticate,
      this.markAllAsRead
    );
  }

  private getUserNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const notifications = await this.notificationService.getUserNotifications(userId, req.query);
      res.status(200).json({
        status: "Success",
        message: "Notifications fetched successfully",
        payload: notifications,
      });
    } catch (error) {
      next(error);
    }
  };

  private getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const count = await this.notificationService.getUnreadCount(userId);
      res.status(200).json({
        status: "Success",
        message: "Unread count fetched successfully",
        payload: { count },
      });
    } catch (error) {
      next(error);
    }
  };

  private markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params ;
      const notification = await this.notificationService.markAsRead(userId, id as string);
      res.status(200).json({
        status: "Success",
        message: "Notification marked as read",
        payload: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  private markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      await this.notificationService.markAllAsRead(userId);
      res.status(200).json({
        status: "Success",
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  };

  private createNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const notification = await this.notificationService.createNotification(req.body);
      res.status(201).json({
        status: "Success",
        message: "Notification created successfully",
        payload: notification,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationController;
