import HttpException from "../../exceptions/http.exception";
import priceModel from "../../price-snapshot/price.model";
import { AuthRole } from "../auths/auth.interface";
import authModel from "../auths/auth.model";
import marketModel from "../markets/market.model";
import productModel from "../products/product.model";
import { StatsResult } from "./stats.interface";
import priceSnapshotModel from "../../price-snapshot/price.model";
import inventoryModel from "../../inventory/inventory.model";
import watchListModel from "../watch-List/watch-list.model";
import alertModel from "../../alert/alert.model";
import mongoose from "mongoose";
class StatsService {
 public async getStats(role: AuthRole, userId: string): Promise<StatsResult> {
  try {
    // 1. Define timeframe for "Recent Activity" (e.g., last 24 hours)

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (role === AuthRole.superAdmin) {
      const [
        usersCount,
        activeUsers,
        marketsCount,
        productsCount,
        totalSnapshots,     // Total historical records
        recentPriceChanges,  // Activity in last 24h
        activeMarkets,
        recentMarkets,
      ] = await Promise.all([
        authModel.countDocuments(),
        authModel.countDocuments({ isActive: true }),
        marketModel.countDocuments(),
        productModel.countDocuments(),
        priceSnapshotModel.countDocuments(),
        priceSnapshotModel.countDocuments({ timestamp: { $gte: twentyFourHoursAgo } }),
        marketModel.countDocuments({ isActive: true }),
        marketModel.find({isActive:true}).sort({ createdAt: -1 }).limit(10).lean(),
      ]);

      return {
        usersCount,
        activeUsers,
        marketsCount,
        productsCount,
        totalSnapshots,
        recentPriceChanges,
        activeMarkets,
        recentMarkets,
      };
    }

    if (role === AuthRole.Admin) {
      // Fetch admin details first to get their allowed markets
      const admin = await authModel.findById(userId).lean();
      const marketIds = admin?.allowedMarkets || [];

      const [productsInMarket, totalProductsListed, marketActivity,recentProducts] = await Promise.all([
        // Products only in the admin's assigned markets
        productModel.countDocuments({ market: { $in: marketIds } }),
        // Products this specific admin created
        productModel.countDocuments({ createdBy: userId }),
      
        // Price updates in the admin's markets in the last 24h
        priceSnapshotModel.countDocuments({ 
          marketId: { $in: marketIds }, 
          timestamp: { $gte: twentyFourHoursAgo } 
        }),
        productModel.find({createdBy:userId}).sort({ createdAt: -1 }).limit(10),
      ]);

      return {
        productsCount: productsInMarket,
        assignedMarkets: marketIds.length,
        totalProductsListed,
        marketActivity, // Shows how many prices were updated in their region
        recentProducts,
      };
    }
    // StatsController.ts



    if (role === AuthRole.User) {
      const [watchlistCount, activeAlerts, inventoryStats] = await Promise.all([
        // 1. Count items the user is currently watching
        watchListModel.countDocuments({ user: userId }),

        // 2. Count active price triggers
        alertModel.countDocuments({ user: userId }),

        // 3. Aggregate total inventory value, historical value, and product count
        
        inventoryModel.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId)} },
          {
            $lookup: {
              from: "products",
              localField: "productId",
              foreignField: "_id",
              as: "productInfo",
            },
          },
          { $unwind: "$productInfo" },
          {
            $lookup: {
              from: "pricesnapshots",
              let: { prodId: "$productId" },
              pipeline: [
                { $match: { $expr: { $eq: ["$productId", "$$prodId"] } } },
                { $sort: { timestamp: -1 } },
                { $skip: 1 },
                { $limit: 1 },
              ],
              as: "previousSnapshot",
            },
          },
          {
            $unwind: {
              path: "$previousSnapshot",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              unitFactor: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$unit", "mudu"] }, then: 1.25 },
                    { case: { $eq: ["$unit", "tiya"] }, then: 0.125 },
                    { case: { $eq: ["$unit", "litre"] }, then: 0.9 },
                    { case: { $eq: ["$unit", "kg"] }, then: 1.0 },
                    { case: { $eq: ["$unit", "tonne"] }, then: 1000.0 },
                  ],
                  default: 1.0,
                },
              },
              productUnitFactor: {
                $switch: {
                  branches: [
                    { case: { $eq: ["$productInfo.unit", "mudu"] }, then: 1.25 },
                    { case: { $eq: ["$productInfo.unit", "tiya"] }, then: 0.125 },
                    { case: { $eq: ["$productInfo.unit", "litre"] }, then: 0.9 },
                    { case: { $eq: ["$productInfo.unit", "kg"] }, then: 1.0 },
                    { case: { $eq: ["$productInfo.unit", "tonne"] }, then: 1000.0 },
                  ],
                  default: 1.0,
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalValue: {
                $sum: {
                  $multiply: [
                    "$quantity",
                    { $divide: ["$unitFactor", "$productUnitFactor"] },
                    "$productInfo.price",
                  ],
                },
              },
              previousTotalValue: {
                $sum: {
                  $multiply: [
                    "$quantity",
                    { $divide: ["$unitFactor", "$productUnitFactor"] },
                    {
                      $ifNull: ["$previousSnapshot.price", "$productInfo.price"],
                    },
                  ],
                },
              },
              productCount: { $sum: 1 },
            },
          },
        ]),
      ]);

      const stats = inventoryStats[0] || {
        totalValue: 0,
        previousTotalValue: 0,
        productCount: 0,
      };
      
      const totalValue = stats.totalValue;
      const previousTotalValue = stats.previousTotalValue;
      
      let percentageChange = 0;
      if (previousTotalValue > 0) {
        percentageChange = ((totalValue - previousTotalValue) / previousTotalValue) * 100;
      }

      return {
        totalInventoryValue: totalValue,
        inventoryItems: stats.productCount,
        inventoryValueChange: Number(percentageChange.toFixed(2)),
        inventoryStatus: percentageChange > 0 ? "increased" : percentageChange < 0 ? "decreased" : "stable",
        watchlistCount,
        activeAlerts,
      };
    }

  
  } catch (error) {
    throw new HttpException(
      404,
      "Failed",
      "Failed to fetch dashboard statistics"
    );
  }
}
  //  public async getTotalUserInventory():Promise<void>{
  //   try {

  //   } catch (error) {
  //     throw new HttpException(404,"Failed",'Failed to fetch User ')
  //   }
  // }
}

export default new StatsService();
