 import HttpException from "../../exceptions/http.exception";
 import marketModel from "./market.model";
 import {IMarketData} from "./market.interface";
import { PaginationQuery } from "../../interface/pagination.interface";
import { createPaginatedResult } from "../../utils/pagination";
import { buildSortOptions } from "../../utils/pagination";
import { paginationQuery } from "../../utils/pagination";
import { PaginationResult } from "../../interface/pagination.interface";
import NotificationQueueService from "../notifications/notification.worker";

 class MarketService{
   
   public async create(data:IMarketData):Promise<IMarketData>{
    try {
      const market = await marketModel.findOne({name:data.name})
      if(market) throw new HttpException(404,"failed","Market already exist")
      const newMarket = new marketModel(data);
      const savedMarket = await newMarket.save();
      
      await NotificationQueueService.queueNewMarketNotification(
        savedMarket.id,
        savedMarket.name,
        savedMarket.location?.state
      );
      
      return savedMarket;
    } catch (error) {
      throw new HttpException(404,"failed",`Market creation failed `);
    }

   }

   public  async update(id:string,data:Partial<IMarketData>):Promise<IMarketData>{
    try {
      const market = await marketModel.findByIdAndUpdate(id,data,{new:true});
      if(!market) throw new HttpException(404,"Not Found","Market doesn't exist ")
      return market;
    } catch (error) {
      throw new HttpException(404,"failed","Failed to update market data ")
    }
   }

   public async delete(id:string):Promise<IMarketData>{
    try {
      const market = await marketModel.findByIdAndUpdate(id,{isDeleted:true,isActive:false},{new:true});
      if(!market) throw new HttpException(404,"Not Found","Market doesn't exist ")
      
      await NotificationQueueService.queueMarketDeletedNotification(market.name);
      
      return market;
    } catch (error) {
      throw new HttpException(404,"failed","Failed to delete market data ")
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

      public async fetchAllPublic(query:any):Promise<PaginationResult<IMarketData>>{
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