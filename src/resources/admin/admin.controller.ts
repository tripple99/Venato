import { Request, Response, NextFunction, Router } from "express";
import GlobalController from "../../controllers/globalControllers";
import { authenticate, authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import adminValidator from "./admin.validator";
import AdminService from "./admin.service";
import AccessControlService from "../access-control/access-control.service";
import rateLimit from "express-rate-limit";

// Rate limit to prevent spamming invites
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit each admin to 20 invites per 15 minutes
  message: "Too many invites sent, please try again later"
});

class AdminController implements GlobalController {
  public path = "admin";
  public router = Router();
  private adminService = new AdminService();
  private accessService = new AccessControlService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/users",
      [authenticate, authorize([AuthRole.superAdmin, AuthRole.Admin])],
      inviteLimiter,
      schemaValidator(adminValidator.createUser),
      this.inviteUser
    );

    this.router.patch(
      "/verify/:id",
      [authenticate, authorize([AuthRole.superAdmin, AuthRole.Admin])],
      this.verifyUser
    );
    this.router.delete(
      "/users/:id",
      [authenticate, authorize([AuthRole.superAdmin])],
      this.deleteUser
    );
  }

  private inviteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      const { email, fullname, role } = req.body;

      const result = await this.adminService.inviteUser(
        adminId,
        email,
        fullname,
        role,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        status: "Success",
        message: "User successfully invited. An email has been sent.",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      const verify = await this.accessService.verifyUser(id as string, adminId, ipAddress, userAgent);
      res.status(200).json({
        status: "Successful",
        message: "User verified successfully",
        payload: verify,
      });
    } catch (error) {
      next(error);
    }
  };

  private deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      await this.adminService.deleteUser(adminId, id as string, ipAddress, userAgent);

      res.status(200).json({
        status: "Success",
        message: "User successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AdminController;
