import { rateLimit } from "express-rate-limit";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import responseTime from "response-time";
import session from "express-session";
import helmet from "helmet";
// @ts-ignore
import xssClean from "xss-clean";
import fs from "fs";
import figlet from "figlet";
import { Server } from "http";
import mongoose from "mongoose";
import GlobalController from "./controllers/globalControllers";
import passport, { initialize } from "passport";
import errorMiddleware from "./Middleware/errorHandling";
import { setupMiddlewares } from "./helpers/express.config";
import { agenda } from "./helpers/agenda";
import morgan from "morgan";
import logger from "./utils/logger";

class App {
  public express: Application;
  public port: number;
  private server!: Server;

  constructor(controllers: GlobalController[], port: number) {
    this.express = express();
    this.port = port;
    this.handleProperMongoDBId();
    this.intializeMiddleware();
    this.initializeControllers(controllers);
    this.initializedRouteNotFound();
    this.initializeErrorHandling();
    this.setupMongooseErrorHandlers();
  
  }

  public listen(): void {
    this.server = this.express.listen(this.port, () => {
      logger.info(`🖥️ App is listening on port : ${this.port} `);
    });
    this.handleGracefullShutDown();
    this.handleAgendaShutDown();
  }


  private async initializeErrorHandling(): Promise<void> {
    this.express.use(errorMiddleware);
  }

  private initializedRouteNotFound(): void {
    this.express.use((req: Request, res: Response) => {
      logger.warn(`Route not found ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        status: "Error",
        message: "Route not found",
        path: req.originalUrl,
      });
    });
  }


  private intializeMiddleware(): void {
    this.express.use(
      morgan("combined", {
        stream: { write: (message: string) => logger.info(message.trim()) },
      }),
    );
    setupMiddlewares(this.express);
    this.configureHelmet();
    // this.configurePassport();
    this.configureRateLimiting();
    // this.configureSession();
    this.configureResponseTime();
    this.enforceHttps();
    // this.configureXssClean();
    this.configureCors();
    this.configureWAF();
  }

  private configureResponseTime(): void {
    this.express.use(
      responseTime((req: Request, res: Response, time: number) => {
        logger.debug(
          `${req.method} from this URL : ${req.originalUrl} took ${time} in ms`,
        );
        res.setHeader("X-Response-Time", time);
      }),
    );
  }

  private configureSession(): void {
    this.express.use(session());
  }

  private configureHelmet(): void {
    this.express.use(helmet());
  }

  private configurePassport(): void {
    this.express.use(passport.initialize());
    this.express.use(passport.session());
  }
  private configureRateLimiting(): void {
    this.express.set('trust proxy', 1);
    this.express.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 1000,
        message: "Limit reached for requesting resourse from this end-point",
        standardHeaders: "draft-7",
        legacyHeaders: false,
      }),
    );
  }

  private initializeControllers(controllers: GlobalController[]): void {
    this.express.get("/", (_req, res) => {
      figlet(
        "VENATO",
        { font: "Cyberlarge" },
        (error: Error | null, data?: string) => {
          if (error) {
            logger.error(`Error generating ASCII Art`, { error: error.message });
            const message = `Welcome to VENATO 🌽 🫘 🫛`;
            res.send(message.trim());
          }
          res.type("text/plain");
          res.send(data);
        },
      );
    });

    controllers.forEach((controllers) => {
      if (controllers?.path && controllers?.router) {
        this.express.use(`/api/${controllers.path}`, controllers.router);
      } else {
        logger.error(`error finding path or routes`);
      }
    });
  }

  private enforceHttps(): void {
    if (process.env.NODE_ENV === "production") {
      this.express.use((req: Request, res: Response, next: NextFunction) => {
        if (!req.secure || req.get("x-forwarded-proto") !== "https") {
          return res.redirect(`https://${req.get("host")}${req.url}`);
        }
        next();
      });
    }
  }

  private configureXssClean(): void {
    this.express.use(xssClean());
  }
  private configureCors(): void {
   const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:4000", // Fixed: added //
      "http://127.0.0.1:4000", // Fixed: removed stray '
      "http://localhost:5173", // Default Vite port
      "https://venato-frontend.vercel.app",
      "https://venato-frontend-flatoi29b-abdallah-muneer-umars-projects.vercel.app",
      "https://venato-eta.vercel.app" // The one you mentioned earlier!
    ];

    interface corsConfiguration {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => void;
      method: string[];
      allowedHeaders: string[];
      credentials: boolean;
    }

    const corsOption: corsConfiguration = {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        // Allow all localhost and 127.0.0.1 requests
        const originUrl = new URL(origin);
        if (
          !origin ||
          allowedOrigins.includes(origin)
      
        ) {
          callback(null, true);
        } else {
        try {
          const originUrl = new URL(origin);
          // Strictly check the hostname and protocol
          if ((originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') && 
              (originUrl.protocol === 'http:' || originUrl.protocol === 'https:')) {
            callback(null, true);
            return;
          }
        } catch(e) {}
        callback(new Error("CORS not allowed for this origin"));
  }
      },
      method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
      ],
      credentials: true,
    };

    this.express.use(cors(corsOption));
  }
  private setupMongooseErrorHandlers(): void {
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed due to app termination");
        process.exit(0);
      } catch (err) {
        logger.error("Error during MongoDB connection close", err);
        process.exit(1);
      }
    });
  }

private handleProperMongoDBId(): void {
  mongoose.plugin((schema) => {
    schema.set("toJSON", {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        delete ret.__v;
        delete ret.password;
        delete ret.resetToken;
        delete ret.otp;

        return ret;
      },
    });

    // Optional: also apply to toObject (if you ever use it)
    schema.set("toObject", {
      virtuals: true,
    });
  });
}
  private handleGracefullShutDown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Closing application...`);
      try {
        await mongoose.connection.close();
        logger.info(`MongoDB connection close`);

        if (this.server) {
          this.server.close(() => {
            logger.info("Express server closed");
          });
          process.exit(0);
        }
      } catch (error) {
        logger.error(`Error during shutdown`, { error });
        process.exit(1);
      }
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (reason: any) => {
      function normalizeError(reason: unknown) {
  if (reason instanceof Error) {
    logger.error("Unhandled Rejection:", { 
        message: reason?.message || reason, 
        stack: reason?.stack,
        reason 
      });
    return {
      message: reason.message,
      stack: reason.stack,
      name: reason.name,
    };
  }

  if (typeof reason === "string") {
    
    return { message: reason };
  }

  try {
    return {
      message: JSON.stringify(reason),
    };
  } catch {
    return {
      message: String(reason),
    };
  }
}
     
    });
  }

  private handleAgendaShutDown(): void {
    process.on("SIGTERM", async () => {
      try {
        await agenda.stop();
        logger.info("Agenda stopped");
        process.exit(0);
      } catch (err) {
        logger.error("Error during Agenda stop", { error: err });
        process.exit(1);
      }
    });

    process.on("SIGINT", async () => {
      try {
        await agenda.stop();
        logger.info("Agenda stopped");
        process.exit(0);
      } catch (err) {
        logger.error("Error during Agenda stop", { error: err });
        process.exit(1);
      }
    });
  }


  private configureWAF(): void {
    this.express.use((req: Request, res: Response, next: NextFunction) => {
      // Block suspicious request patterns
      const url = req.originalUrl.toLowerCase();
      const userAgent = req.headers["user-agent"] || "";

      // Block common attack patterns
      const blockedPatterns = [
        /\.\.\//, // Directory traversal
        /select.*from/i, // SQL injection
        /union.*select/i, // SQL injection
        /script>/i, // XSS
        /eval\(/i, // JS injection
        /\$where/i, // MongoDB injection
        /\$regex/i, // MongoDB regex injection
        /\$ne/i, // MongoDB not equal operator
        /\$gt/i, // MongoDB greater than operator
        /\$exists/i, // MongoDB exists operator
        /\$nin/i, // MongoDB not in operator
        /\{\s*\$[a-z]+\s*:/i, // MongoDB operator pattern
        /db\.collection/i, // MongoDB command
        /ObjectId\(/i, // MongoDB ObjectId
      ];

      // Check URL and user agent for suspicious patterns
      if (
        blockedPatterns.some(
          (pattern) => pattern.test(url) || pattern.test(userAgent),
        )
      ) {
        logger.warn(
          `Blocked suspicious request: ${req.method} ${req.originalUrl}`,
        );
        return res.status(403).json({
          status: "error",
          message: "Request blocked by security policy",
        });
      }

      next();
    });
  }
}

export default App;
