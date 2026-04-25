import "dotenv/config";
import App from "./app";
import validateEnv from "./utils/validate-env";
import connectDB from "./helpers/connect_mongodb";
import { startAgenda } from "./helpers/agenda";
import logger from "./utils/logger";

import AuthControllers from "./resources/auths/auth.controller";
import MarketController from "./resources/markets/market.controllers";
import ProductController from "./resources/products/product.controller";
import AccessController from "./resources/access-control/access-control.controller";
import StatsController from "./resources/stats/stats.controller";
import ProfileController from "./resources/profile/profile.controller";
import WatchListControllers from "./resources/watch-List/watch-list.controller";
import InventoryController from "./resources/inventory/inventory.controller";
import AlertController from "./resources/alert/alert.controller";
import AnalyticsController from "./resources/analytics/analytics.controller";
import AuditLogController from "./resources/audit-logs/audit-log-controller";
import "./resources/audit-logs/audit-queues/audit-queues";

process.on("uncaughtExceptions", (error) => {
  logger.error("Uncaught exception", { error });
  process.exit(1);
});

process.on("unhandledRejections", (reason) => {
  logger.error("Unhandled Rejection", { reason });
});

try {
  validateEnv();
} catch (error) {
  logger.error("Missing Environment Variables", { error });
  process.exit(1);
}

async function startApp() {
  try {
    await connectDB();
    await startAgenda();

    const port = Number(process.env.PORT) || 4000;
    const app = new App(
      [
        new AuthControllers(),
        new MarketController(),
        new ProductController(),
        new AccessController(),
        new StatsController(),
        new ProfileController(),
        new WatchListControllers(),
        new InventoryController(),
        new AlertController(),
        new AnalyticsController(),
        new AuditLogController(),
      ],
      port,
    );

    app.listen();
    logger.info(
      `🚀 Server is running at ${process.env.baseUrl || `http://localhost:${port}`}`,
    );
  } catch (error) {
    logger.error("failed to started Application", { error });
    console.error("Application startup failed", error);
    process.exit(1);
  }
}

startApp();
