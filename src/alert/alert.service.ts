import HttpException from "../exceptions/http.exception";
import { IAlert } from "./alert.interface";
import alertModel from "./alert.model";
import { IPriceSnapshot } from "../price-snapshot/price.interface";
import priceSnapshotModel from "../price-snapshot/price.model";
import AgendaQueueService from "../resources/mail/email.worker";
import authModel from "../resources/auths/auth.model";
import productModel from "../resources/products/product.model";
import AuditLogService from "../resources/audit-logs/audit-log.service";
import { AuthRole } from "../resources/auths/auth.interface";
import mongoose from "mongoose";
import logger from "../utils/logger";
import { PaginationResult, } from "../interface/pagination.interface";
import {createPaginatedQuerySchema,buildSortOptions,createPaginatedResult,paginationQuery} from "../utils/pagination";

class AlertService {
    private queueService = new AgendaQueueService();
    private logs = new AuditLogService();
    
    async createAlert(alert: any, ipAddress?: string, userAgent?: string) {
        try {
            const {productId, targetValue, condition, marketId, user, currency, cooldownMinutes, isActive} = alert;
            const newAlert = new alertModel({
                productId,
                targetValue,
                condition,
                market: marketId || alert.market,
                user,
                currency,
                cooldownMinutes,
                isActive
            });
            const savedAlert = await newAlert.save();
            
            await this.logs.logAction({
                actorId: user,
                actorType: AuthRole.User,
                action: "ALERT_CREATED",
                entityType: "Alert",
                entityId: savedAlert._id,
                status: "SUCCESS",
                ipAddress,
                userAgent,
                metadata: { productId, targetValue, condition }
            });
            
            return savedAlert.populate("productId", "name price market");
        } catch (error: any) {
             await this.logs.logAction({
                actorId: alert.user,
                actorType: AuthRole.User,
                action: "ALERT_CREATED",
                entityType: "Alert",
                status: "FAILED",
                ipAddress,
                userAgent,
                metadata: { error: error.message }
            });
            throw new HttpException(400, "Failed","Failed to create an alert");
        }
    }

    async getAlerts(userId: string,params:any) {
        try {
            const pagination = paginationQuery(params);
            const sortOptions = buildSortOptions(
                pagination.sortBy,
                pagination.sortOrder,
            ); 
            const [alerts, totalCount] = await Promise.all([
                alertModel
                    .find({ user: userId })
                    .populate("productId", "name price")
                    .populate("market", "name location")
                    .sort(sortOptions)
                    .skip(pagination.skip)
                    .limit(pagination.limit)
                    .lean(),
                alertModel.countDocuments({ user: userId }).lean(),
            ]);
            return createPaginatedResult(
                alerts,
                totalCount,
                pagination.page,
                pagination.limit,
            );
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to get alerts");
        }
    }

    async getAlertById(id: string, userId: string) {
        try {
            return await alertModel.findOne({ _id: id, user: userId });
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to get an alert");
        }
    }

    async updateAlert(id: string, userId: string, alert: IAlert, ipAddress?: string, userAgent?: string) {
        try {
            const updatedAlert = await alertModel.findOneAndUpdate({ _id: id, user: userId }, alert, { new: true });
            if (!updatedAlert) throw new HttpException(404, "Not found", "Alert not found");

            await this.logs.logAction({
                actorId: userId,
                actorType: AuthRole.User,
                action: "ALERT_UPDATED",
                entityType: "Alert",
                entityId: updatedAlert._id,
                status: "SUCCESS",
                ipAddress,
                userAgent,
                metadata: { alertId: id }
            });

            return updatedAlert.populate("productId", "name price market");
        } catch (error: any) {
            await this.logs.logAction({
                actorId: userId,
                actorType: AuthRole.User,
                action: "ALERT_UPDATED",
                entityType: "Alert",
                entityId: new mongoose.Types.ObjectId(id),
                status: "FAILED",
                ipAddress,
                userAgent,
                metadata: { error: error.message }
            });
            throw new HttpException(400, "Failed","Failed to update an alert");
        }
    }

    async deleteAlert(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
        try {
            const query = userId ? { _id: id, user: userId } : { _id: id };
            const deletedAlert = await alertModel.findOneAndDelete(query);
            if (!deletedAlert) throw new HttpException(404, "Not found", "Alert not found");

            await this.logs.logAction({
                actorId: userId || deletedAlert.user.toString(),
                actorType: userId ? AuthRole.User : AuthRole.superAdmin,
                action: "ALERT_DELETED",
                entityType: "Alert",
                entityId: deletedAlert._id,
                status: "SUCCESS",
                ipAddress,
                userAgent,
                metadata: { alertId: id }
            });

            return deletedAlert;
        } catch (error: any) {
             await this.logs.logAction({
                actorId: userId,
                actorType: AuthRole.User,
                action: "ALERT_DELETED",
                entityType: "Alert",
                entityId: new mongoose.Types.ObjectId(id),
                status: "FAILED",
                ipAddress,
                userAgent,
                metadata: { error: error.message }
            });
            throw new HttpException(400, "Failed","Failed to delete an alert");
        }
    }

    async suggestThresholds(productId: string) {
        try {
            const periodDate = new Date();
            periodDate.setDate(periodDate.getDate() - 30);
            
            const stats = await priceSnapshotModel.aggregate([
                { $match: { productId: new mongoose.Types.ObjectId(productId), timestamp: { $gte: periodDate } } },
                {
                    $group: {
                        _id: "$productId",
                        avgPrice: { $avg: "$price" },
                        minPrice: { $min: "$price" },
                        maxPrice: { $max: "$price" },
                        stdDev: { $stdDevSamp: "$price" },
                        count: { $sum: 1 }
                    }
                }
            ]);

            if (!stats.length) return null;
            const stat = stats[0];
            return {
                supportPrice: stat.minPrice,
                resistancePrice: stat.maxPrice,
                averagePrice: Math.round(stat.avgPrice),
                volatilityHigh: Math.round(stat.avgPrice + (stat.stdDev || 0)),
                volatilityLow: Math.max(0, Math.round(stat.avgPrice - (stat.stdDev || 0))),
                unusualMovementThreshold: Math.round((stat.stdDev || 0) * 2)
            };
        } catch (error) {
            throw new HttpException(500, "Failed", "Could not calculate thresholds");
        }
    }

 async processMatchingAlerts(snapshot: IPriceSnapshot): Promise<void> {
   const activeAlerts = await alertModel.find({
      productId: snapshot.productId,
      isActive: true
   });

   for (const alert of activeAlerts) {
       let triggered = false;
       switch (alert.condition) {
           case "above": triggered = snapshot.price > alert.targetValue; break;
           case "below": triggered = snapshot.price < alert.targetValue; break;
           case "equal": triggered = snapshot.price === alert.targetValue; break;
           default: triggered = snapshot.price === alert.targetValue;
       }
       
       if (triggered) {
           const now = new Date();
           if (alert.cooldownMinutes && alert.lastTriggeredAt) {
               const diffMs = now.getTime() - alert.lastTriggeredAt.getTime();
               if (diffMs < alert.cooldownMinutes * 60000) {
                   continue;
               }
           }
           
           await alertModel.findByIdAndUpdate(alert._id, { lastTriggeredAt: now });
           
           try {
              const user = await authModel.findById(alert.user);
              const product = await productModel.findById(alert.productId);
              if (user && product) {
                  const content = `<p>Your alert for <b>${product.name}</b> has been triggered!</p><p>The price is now <b>${snapshot.price}</b> which is ${alert.condition} your target of ${alert.targetValue}.</p>`;
                  await this.queueService.sendNow(
                      user.email,
                      "Venato Price Alert Triggered",
                      content,
                      "Alert"
                  );

                  await this.logs.logAction({
                      actorId: user._id,
                      actorType: AuthRole.User,
                      action: "ALERT_TRIGGERED",
                      entityType: "Alert",
                      entityId: alert._id,
                      status: "SUCCESS",
                      metadata: { productId: alert.productId, price: snapshot.price, targetValue: alert.targetValue }
                  });
              }
           } catch (e: any) {
              logger.error("Failed to queue alert email", { error: e.message, stack: e.stack });
              await this.logs.logAction({
                actorId: alert.user,
                actorType: AuthRole.User,
                action: "ALERT_TRIGGERED",
                entityType: "Alert",
                entityId: alert._id,
                status: "FAILED",
                metadata: { error: e.message }
            });
           }
       }
   }
}
}


export default  AlertService;