import { Request, Response, NextFunction, Router } from "express";
import GlobalController from "../../controllers/globalControllers";
import AnalyticsService from "./analytics.service";
import { authenticate } from "../../Middleware/auths";

class AnalyticsController implements GlobalController {
  public path = "analytics";
  public router = Router();
  private analyticsService = new AnalyticsService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/trend/:productId", [authenticate], this.getTrend);
    this.router.get("/compare", [authenticate], this.getCompare);
    this.router.get("/movers", [authenticate], this.getMovers);
    this.router.get(
      "/volatility/:productId",
      [authenticate],
      this.getVolatility,
    );
  }

  private getTrend = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const period = Number(req.query.period) || 30;
      const trend = await this.analyticsService.getTrend(
        req.params.productId,
        period,
      );
      res.status(200).json({ status: "Success", payload: trend });
    } catch (error) {
      next(error);
    }
  };

  private getCompare = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const products = ((req.query.products as string) || "")
        .split(",")
        .filter(Boolean);
      const marketId = req.query.market as string;
      if (!marketId) {
        res
          .status(400)
          .json({ status: "Failed", message: "Market ID is required" });
        return;
      }
      const period = Number(req.query.period) || 30;
      const compare = await this.analyticsService.getCompare(
        products,
        marketId,
        period,
      );
      res.status(200).json({ status: "Success", payload: compare });
    } catch (error) {
      next(error);
    }
  };

  private getMovers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const marketId = req.query.market as string;
      if (!marketId) {
        res
          .status(400)
          .json({ status: "Failed", message: "Market ID is required" });
        return;
      }
      const period = Number(req.query.period) || 7;
      const movers = await this.analyticsService.getMovers(marketId, period);
      res.status(200).json({ status: "Success", payload: movers });
    } catch (error) {
      next(error);
    }
  };

  private getVolatility = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const period = Number(req.query.period) || 30;
      const volatility = await this.analyticsService.getVolatility(
        req.params.productId,
        period,
      );
      res
        .status(200)
        .json({ status: "Success", payload: volatility[0] || null });
    } catch (error) {
      next(error);
    }
  };
}

export default AnalyticsController;
