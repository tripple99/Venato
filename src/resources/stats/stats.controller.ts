// stats.controller.ts
import { Request, Response, NextFunction, Router } from "express";
import GlobalController from "../../controllers/globalControllers";
import { authenticate, authorize } from "../../Middleware/auths";
import { AuthRole } from "../auths/auth.interface";
import StatsService from "./stats.service";

class StatsController implements GlobalController {
    public path = "stats";
    public router = Router();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            "/",
            [authenticate, authorize([AuthRole.Admin, AuthRole.superAdmin,AuthRole.User])],
            this.getStats
        );
    }

    private getStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const role = req.user.userRole
            const userId = req.user.id
            const stats = await StatsService.getStats(role,userId);
            res.status(200).json({ status: "success", message:"Stats has succefully fetched ",payload: stats });
        } catch (err) {
            next(err);
        }
    };
}

export default StatsController;
