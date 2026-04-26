import HttpException from "../../exceptions/http.exception";
import productModel from "./product.model";
import marketModel from "../markets/market.model";
import { IMarketProduct } from "./product.interface";
import { IMarketData } from "../markets/market.interface";
import { PaginationResult } from "../../interface/pagination.interface";
import { PaginationQuery } from "../../interface/pagination.interface";
import {
  buildSortOptions,
  createPaginatedResult,
  paginationQuery,
} from "../../utils/pagination";
import PriceSnapshotService from "../price-snapshot/price.service";
import { Types } from "mongoose";
import watchListModel from "../watch-List/watch-list.model";
import { Source } from "../price-snapshot/price.interface";
import NotificationQueueService from "../notifications/notification.worker";
class ProductService {
  private priceSnapShotService: PriceSnapshotService =
    new PriceSnapshotService();
  private watchListModel: any = watchListModel;
  public async create(product: IMarketProduct): Promise<IMarketProduct> {
    try {
      const marketId = product.market || (product as any).marketId;
      const market = await marketModel.findById(marketId);
      if (!market)
        throw new HttpException(404, "Not found", "Market doesn't exist");
      const isProduct = await productModel.findOne({
        name: product.name,
        market: marketId,
      });
      if (isProduct)
        throw new HttpException(
          404,
          "Not found",
          "Product already exist in this market",
        );
      const newProduct = new productModel({
        ...product,
        market: marketId,
      });
      const savedProduct = await newProduct.save();

      if (savedProduct) {
        await this.priceSnapShotService.create({
          productId: savedProduct.id,
          marketId: market.id,
          price: product.price,
          source: Source.Created,
          timestamp: new Date(),
        });
      }
      return savedProduct;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to create product`);
    }
  }
  public async fetchProductById(uid: string): Promise<IMarketProduct> {
    try {
      const product = await productModel
        .findById(uid)
        .populate("market", "name location");
      if (!product)
        throw new HttpException(401, "Not found", "Product doesn't exist");
      return product;
    } catch (error) {
      throw new HttpException(404, "failed", `failed to fetch product `);
    }
  }

  public async fetchProductByPrice(
    price: string,
    query: any = {},
  ): Promise<PaginationResult<IMarketProduct>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      );
      const filter = {};
      const [products, totalCount] = await Promise.all([
        productModel
          .find(filter)
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        productModel.countDocuments(filter),
      ]);
      return createPaginatedResult(
        products,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(400, "failed", `Failed to fetch user query`);
    }
  }
  public async fetchProductsByMarket(
    market: string,
    query: any = {},
  ): Promise<PaginationResult<IMarketProduct>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      );
      const filter = market;

      const [markets, totalCount] = await Promise.all([
        productModel
          .find({ market: filter })
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        productModel.countDocuments().lean(),
      ]);
      return createPaginatedResult(
        markets,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch user query `);
    }
  }

  public async fetchAllProduct(
    query: any = {},
    userId: string,
  ): Promise<PaginationResult<IMarketProduct>> {
    console.log(userId);

    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      );
      const filter: any = {
        ...(query.marketId && { market: query.marketId }),
        ...(query.category &&
          query.category !== "all" && { category: query.category }),
      };

      // Add Price range filtering
      if (query.minPrice || query.maxPrice) {
        filter.price = {};
        if (query.minPrice) filter.price.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
      }

      if (query.search) {
        const searchRegex = new RegExp(query.search, "i");

        // Find markets matching the search term in name or location
        const matchingMarkets = await marketModel
          .find({
            $or: [
              { name: searchRegex },
              { "location.state": searchRegex },
              { "location.LGA": searchRegex },
            ],
          })
          .select("_id");

        const marketIds = matchingMarkets.map((m) => m._id);

        filter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex }, // Allow searching for category names too
          { sku: searchRegex },
          { market: { $in: marketIds } },
        ];
      }
      const [products, totalCount] = await Promise.all([
        productModel
          .find(filter)
          .populate("market", "name location")
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        productModel.countDocuments(filter),
      ]);
      let watchListIds: string[] = [];
      if (userId) {
        const watchList = await this.watchListModel
          .find({ user: new Types.ObjectId(userId) })
          .select("product");
        watchListIds = watchList.map((w: any) => w.product.toString());
      }

      const productsWithWatchStatus = products.map((product) => ({
        ...product,
        isWatched: watchListIds.includes(product._id.toString()),
      }));
      return createPaginatedResult(
        productsWithWatchStatus,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(400, "failed", `failed to fetch products `);
    }
  }
  public async getProducts(
    uid: any,
    query: any = {},
  ): Promise<PaginationResult<IMarketProduct>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      );
      const [products, totalCount] = await Promise.all([
        productModel
          .find({
            market: uid,
          })
          .sort(sortOptions)
          .populate("market", "name location")
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        productModel.countDocuments({ market: uid }).lean(),
      ]);
      //  if(!products) throw new HttpException(401,"Not found","Product doesn't exist")
      return createPaginatedResult(
        products,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(400, "Failed", `Failed to fetch products `);
    }
  }
  public async update(
    uid: string,
    data: Partial<IMarketProduct>,
  ): Promise<IMarketProduct> {
    try {
      const findMarket = await productModel.findById(uid);
      if (!findMarket)
        throw new HttpException(404, "Not Found", "Product doesn't exist");
      const updatedProduct = await productModel
        .findByIdAndUpdate(
          uid,
          { $set: { ...data } },
          { new: true, runValidators: true },
        )
        .populate("market", "name location")
        .catch((err) => {
          if (err.code === 11000) {
            throw new HttpException(
              400,
              "Duplicate Name",
              "Product name must be unique in this market",
            );
          }
          throw err;
        });

      if (findMarket.price !== data.price) {
        const snapshot = await this.priceSnapShotService.update(uid, {
          productId: new Types.ObjectId(uid),
          marketId: new Types.ObjectId(data.market),
          price: data.price,
          source: Source.Updated,
          timestamp: new Date(),
        });

        if (data.price !== undefined) {
          await NotificationQueueService.queuePriceChangeNotification(
            uid,
            data.price,
            updatedProduct?.name || "a watched product"
          );
        }
      }

      if (!updatedProduct)
        throw new HttpException(404, "Not found", "Product doesn't exist");
      return updatedProduct;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to update product `);
    }
  }

  public async delete(uid: string): Promise<IMarketProduct> {
    try {
      // const findMarket = await productModel.findOne({
      //   _id: uid,
      //   market: market,
      // });
      // if (!findMarket)
      //   throw new HttpException(
      //     404,
      //     "Unauthorised",
      //     "User can't perform CRUD opertation to this product",
      //   );

      const priceSnapshot = await this.priceSnapShotService.update(uid, {
        source: Source.Deleted,
        timestamp: new Date(),
      });
      const deleteProd = await productModel.findOneAndDelete({ _id: uid });
      if (!deleteProd)
        throw new HttpException(404, "Not found", "Product  doesn't exist");
      return deleteProd;
    } catch (error) {
      throw new HttpException(400, "failed", `failed to delete product `);
    }
  }
}

export default ProductService;
