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
      schemaValidator(validate.grantAccess),
      this.revokeUserAccess,
    );
    this.router.post(
      "/",
      [authenticate, authorize([AuthRole.superAdmin])],
      schemaValidator(validate.grantAccess),
      this.grantUserRole,
    );
  }

  private grantUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { role } = req.body;
      const grant = await this.accessService.grantRole(req.params.id, role);
      res.status(200).json({
        status: "Successful",
        message: "User role successfully granted",
        payload: grant,
      });
    } catch (error) {}
  };
  private grantMarketAccess = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, marketId } = req.params;
      const grant = await this.accessService.grantMarketAccess(
        id,
        marketId,
        req.body,
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
      const { id, marketId } = req.params;
      const revoke = await this.accessService.revokeAccess(id);
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
