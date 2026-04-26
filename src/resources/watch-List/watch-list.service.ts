import HttpException from "../../exceptions/http.exception";
import watchListModel from "./watch-list.model";
import { WatchList } from "./watch-list.interface";
import { Types } from "mongoose";
import { IMarketProduct } from "../products/product.interface";
import { TokenPayload } from "../../Middleware/auths";
import { paginationQuery,buildSortOptions,createPaginatedResult } from "../../utils/pagination";
import {
  PaginationResult,
  PaginationQuery,
  PaginationOptions,
} from "../../interface/pagination.interface";

class WatchListService {
  public async createList(
    uid: TokenPayload,
    productId: string,
  ): Promise<WatchList> {
    try {
      const addProduct = await watchListModel.create({
        user: new Types.ObjectId(uid.id),
        product: new Types.ObjectId(productId),
      });

      const populatedWatchlist = await watchListModel
        .findById(addProduct.id)
        .populate("product");
      if (!populatedWatchlist) {
        throw new HttpException(
          404,
          "Not Found",
          "Watchlist entry not found after creation",
        );
      }
      return populatedWatchlist;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new HttpException(
          409,
          "Conflict",
          "Product already exists in watchlist",
        );
      }
      throw new HttpException(
        400,
        "Failed",
        `Failed to add product to watch list`,
      );
    }
  }
  public async deleteListById(uid: string,userId:string): Promise<void> {
    try {
      const list = await watchListModel.findByIdAndDelete({ _id: uid,user:userId });
      if (!list)
        throw new HttpException(
          404,
          "Not Found",
          "Watchlist entry not found after deletion",
        );
    } catch (error) {
      throw new HttpException(
        400,
        "Failed",
        `Failed to remove product from watch list `,
      );
    }
  }
  public async getAll(
    uid: string,
    query: any,
  ): Promise<PaginationResult<WatchList>> {
    try {
        const pagination = paginationQuery(query);
            // const sortOptions = buildSortOptions(
            //   pagination.sortBy,
            //   pagination.sortOrder,
            // );
    const [watchList, totalCount] = await Promise.all([
  watchListModel
    .find({ user: new Types.ObjectId(uid) })
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .populate({
      path: "product",
      populate: { path: "market" ,select:"name currency location"} // Returns full product object WITH full market object inside it
    }),
  watchListModel.countDocuments({ user: new Types.ObjectId(uid) })
]);
      return createPaginatedResult(watchList,totalCount,pagination.page,pagination.limit);
    } catch (error) {
      throw new HttpException(
        400,
        "Failed",
        `Failed to fetch product from watch list `,
      );
    }
  }
}

export default WatchListService;
