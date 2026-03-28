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
        recentPriceChanges  // Activity in last 24h
      ] = await Promise.all([
        authModel.countDocuments(),
        authModel.countDocuments({ isActive: true }),
        marketModel.countDocuments(),
        productModel.countDocuments(),
        priceSnapshotModel.countDocuments(),
        priceSnapshotModel.countDocuments({ timestamp: { $gte: twentyFourHoursAgo } })
      ]);

      return {
        usersCount,
        activeUsers,
        marketsCount,
        productsCount,
        totalSnapshots,
        recentPriceChanges,
      };
    }

    if (role === AuthRole.Admin) {
      // Fetch admin details first to get their allowed markets
      const admin = await authModel.findById(userId).lean();
      const marketIds = admin?.allowedMarkets || [];

      const [productsInMarket, totalProductsListed, marketActivity] = await Promise.all([
        // Products only in the admin's assigned markets
        productModel.countDocuments({ market: { $in: marketIds } }),
        // Products this specific admin created
        productModel.countDocuments({ createdBy: userId }),
        // Price updates in the admin's markets in the last 24h
        priceSnapshotModel.countDocuments({ 
          marketId: { $in: marketIds }, 
          timestamp: { $gte: twentyFourHoursAgo } 
        })
      ]);

      return {
        productsCount: productsInMarket,
        assignedMarkets: marketIds.length,
        totalProductsListed,
        marketActivity, // Shows how many prices were updated in their region
      };
    }

    if (role === AuthRole.User) {
  const [watchlistCount, activeAlerts, inventoryStats] = await Promise.all([
    // 1. Count items the user is currently watching
    watchListModel.countDocuments({ userId }),
    
    // 2. Count active price triggers
    priceModel.countDocuments({ userId, isActive: true }),
    
    // 3. Aggregate total inventory value and unique product count
    inventoryModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "products", // Ensure this matches your Product collection name
          localField: "productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
          productCount: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    totalInventoryValue: inventoryStats[0]?.totalValue || 0,
    inventoryItems: inventoryStats[0]?.productCount || 0,
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
