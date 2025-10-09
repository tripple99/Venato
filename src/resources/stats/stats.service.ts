import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import marketModel from "../markets/market.model";
import productModel from "../products/product.model";
import { StatsResult } from "./stats.interface";



class StatsService {
public async getStats():Promise<StatsResult> {
  try {
       const [usersCount, activeUsers, marketsCount, productsCount] = await Promise.all([
          authModel.countDocuments(),
          authModel.countDocuments({ isActive: true }),
          marketModel.countDocuments(),
          productModel.countDocuments(),
    ]);

    return { usersCount, activeUsers, marketsCount, productsCount };
  } catch (error) {
     throw new HttpException(404,"Failed",`Failed to fetch Application Data ${error}`) 
  }
 
  }
}

export default new StatsService();
