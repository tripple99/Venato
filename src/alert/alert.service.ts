import HttpException from "../exceptions/http.exception";
import { IAlert } from "./alert.interface";
import alertModel from "./alert.model";
import { IPriceSnapshot } from "../price-snapshot/price.interface";
import priceSnapshotModel from "../price-snapshot/price.model";
import AgendaQueueService from "../resources/mail/email.worker";
import authModel from "../resources/auths/auth.model";
import productModel from "../resources/products/product.model";
import mongoose from "mongoose";

class AlertService {
    private queueService = new AgendaQueueService();
    
    async createAlert(alert: any) {
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
            return await newAlert.save();
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to create an alert");
        }
    }

    async getAlerts(userId: string) {
        try {
            return await alertModel.find({ user: userId });
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

    async updateAlert(id: string, userId: string, alert: IAlert) {
        try {
            return await alertModel.findOneAndUpdate({ _id: id, user: userId }, alert, { new: true });
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to update an alert");
        }
    }

    async deleteAlert(id: string, userId?: string) {
        try {
            const query = userId ? { _id: id, user: userId } : { _id: id };
            return await alertModel.findOneAndDelete(query);
        } catch (error) {
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
              }
           } catch (e) {
              console.error("Failed to queue alert email", e);
           }
       }
   }
}
}

export default  AlertService;