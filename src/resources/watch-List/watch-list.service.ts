import HttpException from "../../exceptions/http.exception" 
import watchListModel from "./watch-list.model"
import { WatchList } from "./watch-list.interface"
import { Types } from "mongoose"
import { IMarketProduct } from "../products/product.interface"
import { TokenPayload } from "../../Middleware/auths"
class WatchListService{
   public async createList(uid:TokenPayload,productId:string):Promise<WatchList>{
    try {
      const addProduct = await watchListModel.create({
        user:new Types.ObjectId(uid.id),
        product:new Types.ObjectId(productId)
      })
       
       const populatedWatchlist = await watchListModel.findById(addProduct._id).populate("product")  
         if (!populatedWatchlist) {
          throw new HttpException(404, "Not Found", "Watchlist entry not found after creation");
        }
       return populatedWatchlist;
    } catch (error:any) {
      if(error.code === 11000){
         throw new HttpException(409, "Conflict", "Product already exists in watchlist");
      }
      throw new HttpException(400,"Failed",`Failed to add product to watch list ${error}`)
    }
   }
   public async deleteListById(uid:string):Promise<void>{
    try {
      const list = await watchListModel.findByIdAndDelete({uid});
    }catch(error) {
      throw new HttpException(400,"Failed",`Failed to remove product from watch list ${error}`)
    }
   }
   public async getAll():Promise<WatchList[]>{
    try {
       const watchList = await watchListModel.find().populate("product")
       return watchList;
    } catch (error) {
      throw new HttpException(400,"Failed",`Failed to fetch product from watch list ${error}`) 
    }
   }
}

export default WatchListService;