import { Request, Response, NextFunction, Router } from "express";
import GlobalController from "../../controllers/globalControllers";
import { authenticate, authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import adminValidator from "./admin.validator";
import AdminService from "./admin.service";
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
}

export default AdminController;
