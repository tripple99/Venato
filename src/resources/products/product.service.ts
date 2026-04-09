import HttpException from "../../exceptions/http.exception";
import productModel from "./product.model";
import mongoose from "mongoose";
import marketModel from "../markets/market.model";
import { IMarketProduct } from "./product.interface";
import { IMarketData } from "../markets/market.interface";
import {
  PaginationOptions,
  PaginationMetaData,
  PaginationResult,
} from "../../interface/pagination.interface";
import { PaginationQuery } from "../../interface/pagination.interface";
import {
  buildSortOptions,
  createPaginatedResult,
  paginationQuery,
} from "../../utils/pagination";
import PriceSnapshotService from "../../price-snapshot/price.service";
import { Types, } from "mongoose";
import { Source } from "../../price-snapshot/price.interface";
class ProductService {
  private priceSnapShotService: PriceSnapshotService =
    new PriceSnapshotService();

  public async create(
    product: IMarketProduct,
  ): Promise<IMarketProduct> {
    try {
      const marketId = product.market || (product as any).marketId;
      const market = await marketModel.findById(marketId);
      if (!market)
        throw new HttpException(404, "Not found", "Market doesn't exist");
      const isProduct = await productModel.findOne({ name: product.name, market: marketId });
      if (isProduct)
        throw new HttpException(404, "Not found", "Product already exist in this market");
      const newProduct = new productModel({
        ...product,
        market: marketId
      });
      const savedProduct = await newProduct.save();
   
      if(savedProduct){
        await this.priceSnapShotService.create({
          productId: savedProduct.id,
          marketId: market.id,
          price: product.price,
          source:Source.Created,
          timestamp: new Date(),
         
        });
      }
      return savedProduct;
    } catch (error) {
      throw new HttpException(
        404,
        "failed",
        `failed to create product ${error}`,
      );
    }
  }
  public async fetchProductById(uid: string): Promise<IMarketProduct> {
    try {
      const product = await productModel.findById(uid);
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
      throw new HttpException(
        400,
        "failed",
        `Failed to fetch user query`,
      );
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
          .sort(sortOptions)
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
      throw new HttpException(
        400,
        "failed",
        `failed to fetch user query `,
      );
    }
  }

  public async fetchAllProduct(query:any={}): Promise<PaginationResult<IMarketProduct>> {
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      ); 
      const [products, totalCount] = await Promise.all([
        productModel
          .find()
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        productModel.countDocuments().lean(),
      ]);
      return createPaginatedResult(
        products,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(
        400,
        "failed",
        `failed to fetch products `,
      );
    }
  }
  public async getProducts(uid: any): Promise<IMarketProduct[]> {
    try {
      const products = await productModel.find({
        market: uid,
      }).lean();
      //  if(!products) throw new HttpException(401,"Not found","Product doesn't exist")
      return products;
    } catch (error) {
      throw new HttpException(
        400,
        "Failed",
        `Failed to fetch products `,
      );
    }
  }
  public async update(
    uid: string,
    data: Partial<IMarketProduct>,
  ): Promise<IMarketProduct> {
    try {
      const findMarket = await productModel.findById(uid);
      if (!findMarket)
        throw new HttpException(
          404,
          "Not Found",
          "Product doesn't exist",
        );
      const updatedProduct = await productModel
        .findByIdAndUpdate(
          uid,
          { $set: { ...data } },
          { new: true, runValidators: true },
        )
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
      
       if(findMarket.price !== data.price){
      
    const snapshot =   await this.priceSnapShotService.update(uid,{
          productId:new Types.ObjectId(uid),
          marketId: new Types.ObjectId(data.market),
          price: data.price,
          source:Source.Updated,
          timestamp: new Date(),
        });
      }

      if (!updatedProduct)
        throw new HttpException(404, "Not found", "Product doesn't exist");
      return updatedProduct;
    } catch (error) {
      throw new HttpException(
        400,
        "failed",
        `failed to update product ${error}`,
      );
    }
  }

  public async delete(uid: string, market: any): Promise<IMarketProduct> {
    try {
      const findMarket = await productModel.findOne({
        _id: uid,
        market: market,
      });
      if (!findMarket)
        throw new HttpException(
          404,
          "Unauthorised",
          "User can't perform CRUD opertation to this product",
        );
      const priceSnapshot = await this.priceSnapShotService.update(uid,{
        source:Source.Deleted,
        timestamp: new Date(),
      });
      const deleteProd = await productModel.findByIdAndDelete(uid);
      if (!deleteProd)
        throw new HttpException(404, "Not found", "Product  doesn't exist");
      return deleteProd;
    } catch (error) {
      throw new HttpException(
        400,
        "failed",
        `failed to delete product`,
      );
    }
  }
}

export default ProductService;
