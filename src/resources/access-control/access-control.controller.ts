import { Request, Response, NextFunction, Router } from "express";
import GlobalControllers from "../../controllers/globalControllers";
import AccessControlService from "./access-control.service";
import { authenticate, authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validate from "./access-control.validator";

class AccessController implements GlobalControllers {
  public path = "access";
  public router = Router();
  private accessService = new AccessControlService();

  constructor() {
    this.initializeController();
  }

  private initializeController(): void {
    this.router.patch(
      "/:id/:marketId",
      [authenticate, authorize([AuthRole.superAdmin])],
     
      this.grantMarketAccess,
    );
    this.router.patch(
      "/revoke/:id/:marketId",
      [authenticate, authorize([AuthRole.superAdmin])],
      this.revokeUserAccess,
    );
    this.router.post(
      "/:id",
      [authenticate, authorize([AuthRole.superAdmin])],
      schemaValidator(validate.grantAccess),
      this.grantUserRole,
    );  
    this.router.get(
      "/",
      [authenticate, authorize([AuthRole.superAdmin])],
      this.getAllUsers,
    );
    this.router.patch(
      "/verify/:id",
      [authenticate, authorize([AuthRole.superAdmin])],
      this.verifyUser,
    );

  }

  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const users = await this.accessService.getAllUsers(req.query);
      res.status(200).json({
        status: "Successful",
        message: "Users fetched successfully",
        payload: users,
      });
    } catch (error) {
      next(error);
    }
  };
  private grantUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userRole } = req.body;
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      const grant = await this.accessService.grantRole(req.params.id, userRole, adminId, ipAddress, userAgent);
      res.status(200).json({
        status: "Successful",
        message: "User role successfully granted",
        payload: grant,
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
      const verify = await this.accessService.verifyUser(id, adminId, ipAddress, userAgent);
      res.status(200).json({
        status: "Successful",
        message: "User verified successfully",
        payload: verify,
      });
    } catch (error) {
      next(error);
    }
  };
  private grantMarketAccess = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, marketId } = req.params;
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      const grant = await this.accessService.grantMarketAccess(
        id,
        marketId,
        adminId,
        ipAddress,
        userAgent
      );
      res.status(200).json({
        status: "Successful",
        message: "User Market access successfully granted",
        payload: grant,
      });
    } catch (error) {
      next(error);
    }
  };

  private revokeUserAccess = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = (req as any).user?.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");
      const revoke = await this.accessService.revokeAccess(id, adminId, ipAddress, userAgent);
      res.status(200).json({
        status: "Success",
        message: "User Access revoke successfully",
        payload: revoke,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AccessController;
