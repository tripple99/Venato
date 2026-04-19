import HttpException from "../exceptions/http.exception";
import { IInventory } from "./inventory.interface";
import inventoryModel from "./inventory.model";
import productModel from "../resources/products/product.model";
import marketModel from "../resources/markets/market.model";
import { Types } from "mongoose";
import { PaginationQuery,PaginationResult,PaginationOptions } from "../interface/pagination.interface";
import { paginationQuery } from "../utils/pagination";
import { buildSortOptions } from "../utils/pagination";
import { createPaginatedResult } from "../utils/pagination";
class InventoryService {
  public async create(
    userId: string,
    inventory: IInventory,
  ): Promise<IInventory | null> {
    try {
      // 1. Validate Product Existence
      const product = await productModel.findById(inventory.productId);
      if (!product) {
        throw new HttpException(
          404,
          "Not found",
          "The selected product does not exist in our database.",
        );
      }

      // 2. Conditional Market Validation (Only check if preferredMarket is provided)
      if (inventory.preferredMarket) {
        const marketId = inventory.preferredMarket.toString().trim();
        if (!Types.ObjectId.isValid(marketId)) {
          throw new HttpException(400, "Bad Request", "Invalid ID format");
        }
        const market = await marketModel.findOne({_id:marketId});
        if (!market) {
          throw new HttpException(
            404,
            "Not found",
            "The preferred market provided is invalid.",
          );
        }
      }

      const updatedInventory = await inventoryModel.findOneAndUpdate(
        {
          userId: userId,
          productId: inventory.productId,
        },
        {
          $set: {
            quantity: inventory.quantity,
            unit: inventory.unit,
            preferredMarket: inventory.preferredMarket,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      ).populate("productId", "name unit").populate("preferredMarket", "name location");

      return updatedInventory;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        400,
        "failed",
        "An unexpected error occurred while updating your inventory.",
      );
    }
  }

  public async update(
    userId: string,
    inventoryId: string,
    updates: Partial<IInventory>,
  ): Promise<IInventory | null> {
    try {
      const existing = await inventoryModel.findOne({
        _id: inventoryId,
        userId,
      });
      if (!existing) {
        throw new HttpException(
          404,
          "Not found",
          "Inventory record not found or access denied.",
        );
      }

      if (updates.preferredMarket) {
        const market = await marketModel.findById(updates.preferredMarket);
        if (!market)
          throw new HttpException(
            400,
            "Invalid Data",
            "The selected market is invalid.",
          );
      }

      const updated = await inventoryModel.findByIdAndUpdate(
        inventoryId,
        {
          $set: {
            ...updates,
            updatedAt: new Date(),
          },
        },
        { new: true, runValidators: true },
      );

      return updated;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        400,
        "Update failed",
        "Could not update inventory.",
      );
    }
  }

  public async delete(
    userId: string,
    inventoryId: string,
  ): Promise<IInventory> {
    try {
      const deletedInventory = await inventoryModel.findOneAndDelete({
        _id: inventoryId,
        userId: userId,
      });
      if (!deletedInventory)
        throw new HttpException(
          404,
          "Not found",
          "Inventory doesn't exist or access denied",
        );
      return deletedInventory;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to delete inventory`);
    }
  }

  public async fetch(userId: string,query:any):Promise<PaginationResult<IInventory>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      ); 
      const [inventories, totalCount] = await Promise.all([
        inventoryModel
          .find({ userId }).populate("productId").populate("preferredMarket")
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        inventoryModel.countDocuments({ userId }).lean(),
      ]);
      return createPaginatedResult(
        inventories,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch inventory`);
    }
  }

  public async fetchById(
    userId: string,
    inventoryId: string,
  ): Promise<IInventory> {
    try {
      const inventory = await inventoryModel.findOne({
        _id: inventoryId,
        userId: userId,
      }).lean();
      if (!inventory)
        throw new HttpException(
          404,
          "Not found",
          "Inventory doesn't exist or access denied",
        );
      return inventory;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch inventory`);
    }
  }

  public async getPortfolioPerformance(userId: string,query:any):Promise<{
    totalPortfolioValue: number;
    holdings: PaginationResult<IInventory>;
  }> {
    const pagination = paginationQuery(query);
    const sortOptions = buildSortOptions(
      pagination.sortBy,
      pagination.sortOrder,
    ); 
    const [inventories, totalCount] = await Promise.all([
      inventoryModel.aggregate([
      // 1. Filter by current user
      { $match: { userId: new Types.ObjectId(userId) } },

      // 2. Join with Products to get CURRENT price
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },

      // 3. Join with PriceSnapshots to get the PREVIOUS price
      // We look for the most recent snapshot that isn't the current one
      {
        $lookup: {
          from: "pricesnapshots",
          let: { prodId: "$productId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$productId", "$$prodId"] } } },
            { $sort: { timestamp: -1 } },
            { $skip: 1 }, // Skip the very latest (current) snapshot
            { $limit: 1 }, // Get the one immediately before it
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

      // 4. Multi-market comparison (find max and avg price for this product in OTHER markets)
      {
        $lookup: {
          from: "pricesnapshots",
          let: { prodId: "$productId", currMarket: "$preferredMarket" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$productId", "$$prodId"] },
                    // Ignore null preferredMarket or match any alternative market if not specific
                    { $ne: ["$marketId", { $ifNull: ["$$currMarket", null] }] },
                  ],
                },
              },
            },
            { $sort: { timestamp: -1 } },
            // distinct by marketId
            {
              $group: {
                _id: "$marketId",
                latestPrice: { $first: "$price" },
              },
            },
            {
              $group: {
                _id: null,
                avgOtherMarketPrice: { $avg: "$latestPrice" },
                maxOtherMarketPrice: { $max: "$latestPrice" },
              },
            },
          ],
          as: "otherMarkets",
        },
      },
      { $unwind: { path: "$otherMarkets", preserveNullAndEmptyArrays: true } },

      // 5. Calculate Values and Percentages
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
                { case: { $eq: ["$productDetails.unit", "mudu"] }, then: 1.25 },
                { case: { $eq: ["$productDetails.unit", "tiya"] }, then: 0.125 },
                { case: { $eq: ["$productDetails.unit", "litre"] }, then: 0.9 },
                { case: { $eq: ["$productDetails.unit", "kg"] }, then: 1.0 },
                { case: { $eq: ["$productDetails.unit", "tonne"] }, then: 1000.0 },
              ],
              default: 1.0,
            },
          },
        },
      },
      {
        $addFields: {
          currentValue: {
            $multiply: [
              "$quantity",
              { $divide: ["$unitFactor", "$productUnitFactor"] },
              "$productDetails.price",
            ],
          },
          previousPrice: {
            $ifNull: ["$previousSnapshot.price", "$productDetails.price"],
          },
          priceDifference: {
            $subtract: [
              "$productDetails.price",
              { $ifNull: ["$previousSnapshot.price", "$productDetails.price"] },
            ],
          },
        },
      },
      {
        $addFields: {
          percentageChange: {
            $cond: [
              { $eq: ["$previousPrice", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$priceDifference", "$previousPrice"] },
                  100,
                ],
              },
            ],
          },
        },
      },

      // 6. Final Projection
      {
        $project: {
          productName: "$productDetails.name",
          quantity: 1,
          unit: 1,
          currentPrice: "$productDetails.price",
          previousPrice: 1,
          currentValue: 1,
          percentageChange: { $round: ["$percentageChange", 2] },
          status: {
            $cond: [
              { $gt: ["$percentageChange", 0] },
              "increased",
              "decreased",
            ],
          },
          otherMarketMaxPrice: "$otherMarkets.maxOtherMarketPrice",
          otherMarketAvgPrice: {
            $round: ["$otherMarkets.avgOtherMarketPrice", 2],
          },
        },
      },
    ]),
    inventoryModel.countDocuments({ userId }).lean(),
  ]);

    // Calculate Grand Totals
    const totalPortfolioValue = inventories.reduce(
      (acc, item) => acc + item.currentValue,
      0,
    );

    return {
      totalPortfolioValue,
      holdings: createPaginatedResult(inventories,totalCount,pagination.page,pagination.limit),
    };
  }
}

export default InventoryService;
