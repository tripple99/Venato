import HttpException from "../exceptions/http.exception";
import { IInventory } from "./inventory.interface";
import inventoryModel from "./inventory.model";
import productModel from "../resources/products/product.model";
import marketModel from "../resources/markets/market.model";
import { Types } from "mongoose";
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
        const market = await marketModel.findById(inventory.preferredMarket);
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
      );

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
    inventory: IInventory,
  ): Promise<IInventory> {
    try {
      const product = await productModel.findById(inventory.productId);
      if (!product)
        throw new HttpException(404, "Not found", "Product doesn't exist");
      const market = await marketModel.findById(inventory.preferredMarket);
      if (!market)
        throw new HttpException(404, "Not found", "Market doesn't exist");
      const deletedInventory = await inventoryModel.findByIdAndDelete(
        inventory._id,
      );
      if (!deletedInventory)
        throw new HttpException(404, "Not found", "Inventory doesn't exist");
      return deletedInventory;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to delete inventory`);
    }
  }

  public async fetch(userId: string): Promise<IInventory[]> {
    try {
      const inventories = await inventoryModel.find({ userId });
      if (!inventories)
        throw new HttpException(404, "Not found", "Inventory doesn't exist");
      return inventories;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch inventory`);
    }
  }

  public async fetchById(
    userId: string,
    inventoryId: string,
  ): Promise<IInventory> {
    try {
      const product = await productModel.findById(inventoryId);
      if (!product)
        throw new HttpException(404, "Not found", "Product doesn't exist");
      const market = await marketModel.findById(inventoryId);
      if (!market)
        throw new HttpException(404, "Not found", "Market doesn't exist");
      const inventory = await inventoryModel.findById(inventoryId);
      if (!inventory)
        throw new HttpException(404, "Not found", "Inventory doesn't exist");
      return inventory;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch inventory`);
    }
  }

      public async getPortfolioPerformance(userId: string) {
    const portfolio = await inventoryModel.aggregate([
      // 1. Filter by current user
      { $match: { userId: new Types.ObjectId(userId) } },

      // 2. Join with Products to get CURRENT price
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
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
            { $limit: 1 } // Get the one immediately before it
          ],
          as: "previousSnapshot"
        }
      },
      { $unwind: { path: "$previousSnapshot", preserveNullAndEmptyArrays: true } },

      // 4. Calculate Values and Percentages
      {
        $addFields: {
          currentValue: { $multiply: ["$quantity", "$productDetails.price"] },
          previousPrice: { $ifNull: ["$previousSnapshot.price", "$productDetails.price"] },
          priceDifference: { 
            $subtract: ["$productDetails.price", { $ifNull: ["$previousSnapshot.price", "$productDetails.price"] }] 
          }
        }
      },
      {
        $addFields: {
          percentageChange: {
            $cond: [
              { $eq: ["$previousPrice", 0] },
              0,
              { $multiply: [{ $divide: ["$priceDifference", "$previousPrice"] }, 100] }
            ]
          }
        }
      },

      // 5. Final Projection
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
            $cond: [{ $gt: ["$percentageChange", 0] }, "increased", "decreased"]
          }
        }
      }
    ]);

    // Calculate Grand Totals
    const totalPortfolioValue = portfolio.reduce((acc, item) => acc + item.currentValue, 0);

    return {
      totalPortfolioValue,
      holdings: portfolio
    };
  }
}

export default InventoryService;
