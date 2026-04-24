import HttpException from "../../exceptions/http.exception";
import priceSnapshotModel from "../price-snapshot/price.model";
import mongoose from "mongoose";

class AnalyticsService {
  public async getTrend(productId: string, periodDays: number = 30) {
    try {
      const periodDate = new Date();
      periodDate.setDate(periodDate.getDate() - Math.max(1, periodDays));

      return await priceSnapshotModel.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
            timestamp: { $gte: periodDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } catch (error) {
      throw new HttpException(500, "Failed", "Could not fetch trend analytics");
    }
  }

  public async getCompare(
    productIds: string[],
    marketId: string,
    periodDays: number = 30,
  ) {
    try {
      const periodDate = new Date();
      periodDate.setDate(periodDate.getDate() - Math.max(1, periodDays));
      const objectIdProducts = productIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      const marketObjectId = new mongoose.Types.ObjectId(marketId);

      return await priceSnapshotModel.aggregate([
        {
          $match: {
            productId: { $in: objectIdProducts },
            marketId: marketObjectId,
            timestamp: { $gte: periodDate },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              productId: "$productId",
            },
            avgPrice: { $avg: "$price" },
          },
        },
        { $sort: { "_id.date": 1 } },
        {
          $group: {
            _id: "$_id.date",
            products: {
              $push: {
                productId: "$_id.productId",
                price: "$avgPrice",
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        "Could not fetch comparison analytics",
      );
    }
  }

  public async getMovers(marketId: string, periodDays: number = 7) {
    try {
      const now = new Date();
      const periodDate = new Date();
      periodDate.setDate(now.getDate() - Math.max(1, periodDays));

      return await priceSnapshotModel.aggregate([
        {
          $match: {
            marketId: new mongoose.Types.ObjectId(marketId),
            timestamp: { $gte: periodDate },
          },
        },
        {
          $sort: { timestamp: 1 },
        },
        {
          $group: {
            _id: "$productId",
            oldestPrice: { $first: "$price" },
            newestPrice: { $last: "$price" },
          },
        },
        {
          $addFields: {
            priceChange: { $subtract: ["$newestPrice", "$oldestPrice"] },
            percentageChange: {
              $cond: [
                { $eq: ["$oldestPrice", 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ["$newestPrice", "$oldestPrice"] },
                        "$oldestPrice",
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.name",
            oldestPrice: 1,
            newestPrice: 1,
            percentageChange: { $round: ["$percentageChange", 2] },
          },
        },
        { $sort: { percentageChange: -1 } },
      ]);
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        "Could not fetch movers analytics",
      );
    }
  }

  public async getVolatility(productId: string, periodDays: number = 30) {
    try {
      const periodDate = new Date();
      periodDate.setDate(periodDate.getDate() - Math.max(1, periodDays));

      return await priceSnapshotModel.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
            timestamp: { $gte: periodDate },
          },
        },
        {
          $group: {
            _id: "$productId",
            avgPrice: { $avg: "$price" },
            stdDev: { $stdDevSamp: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]);
    } catch (error) {
      throw new HttpException(
        500,
        "Failed",
        "Could not fetch volatility analytics",
      );
    }
  }
}

export default AnalyticsService;
