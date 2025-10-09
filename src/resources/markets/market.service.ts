 import HttpException from "../../exceptions/http.exception";
 import marketModel from "./market.model";
 import {IMarketData} from "./market.interface";



 class MarketService{
   
   public async create(data:IMarketData):Promise<IMarketData>{
    try {
      const market = await marketModel.findOne({name:data.name})
      if(market) throw new HttpException(404,"failed","Market already exist")
      const newMarket = new marketModel(data);
      return await newMarket.save() 
    } catch (error) {
      throw new HttpException(404,"failed",`Market creation failed ${error}`);
    }

   }
   public async fetchAll():Promise<IMarketData[]>{
    try {
      return await marketModel.find();
    } catch (error) {
      throw new HttpException(404,"failed",`Failed to fetch market data ${error}`)
    }
   }
   public async fetchById(uid:string):Promise<IMarketData>{
    try {
       const market = await marketModel.findById(uid);
       if(!market) throw new HttpException(404,"Not Found","Market doesn't exist ")
       return market; 
    } catch (error) {
      throw new HttpException(404,"failed","Failed to fetch market data ${error")
    }
   }
 }


 export default MarketService;