import { Router, Request, Response, NextFunction } from "express";
import GlobalController from "../../controllers/globalControllers";
import AuditLogService from "./audit-log.service";
import { authenticate, authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";

class AuditLogController implements GlobalController {
    public path: string = "audit-logs";
    public router: Router = Router();
    private auditLogService = new AuditLogService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            "/",
            [authenticate, authorize([AuthRole.superAdmin])],
            this.getAllAuditLogs
        );
    }

    getAllAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const auditLogs = await this.auditLogService.getAllAuditLogs(req.query);
            res.status(200).json({
                status: "success",
                message: "Audit logs fetched successfully",
                payload: auditLogs
            });
        } catch (error) {
            next(error);
        }
    };
}

export default AuditLogController;
