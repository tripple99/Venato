 import HttpException from "../../exceptions/http.exception";
 import marketModel from "./market.model";
 import {IMarketData} from "./market.interface";
import { PaginationQuery } from "../../interface/pagination.interface";
import { createPaginatedResult } from "../../utils/pagination";
import { buildSortOptions } from "../../utils/pagination";
import { paginationQuery } from "../../utils/pagination";
import { PaginationResult } from "../../interface/pagination.interface";

 class MarketService{
   
   public async create(data:IMarketData):Promise<IMarketData>{
    try {
      const market = await marketModel.findOne({name:data.name})
      if(market) throw new HttpException(404,"failed","Market already exist")
      const newMarket = new marketModel(data);
      return await newMarket.save() 
    } catch (error) {
      throw new HttpException(404,"failed",`Market creation failed `);
    }

   }
   public async fetchAll(query:any):Promise<PaginationResult<IMarketData>>{
    try {
      const pagination = paginationQuery(query);
      const sortOptions = buildSortOptions(
        pagination.sortBy,
        pagination.sortOrder,
      ); 
      const [markets, totalCount] = await Promise.all([
        marketModel
          .find()
          .sort(sortOptions)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        marketModel.countDocuments().lean(),
      ]);
      return createPaginatedResult(
        markets,
        totalCount,
        pagination.page,
        pagination.limit,
      );
    } catch (error) {
      throw new HttpException(404,"failed",`Failed to fetch market data `)
    }
   }
   public async fetchById(uid:string):Promise<IMarketData>{
    try {
       const market = await marketModel.findById(uid);
       if(!market) throw new HttpException(404,"Not Found","Market doesn't exist ")
       return market; 
    } catch (error) {
      throw new HttpException(404,"failed","Failed to fetch market data ")
    }
   }
 }


 export default MarketService;