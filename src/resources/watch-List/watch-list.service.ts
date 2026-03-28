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
       
       const populatedWatchlist = await watchListModel.findById(addProduct.id).populate("product")  
         if (!populatedWatchlist) {
          throw new HttpException(404, "Not Found", "Watchlist entry not found after creation");
        }
       return populatedWatchlist;
    } catch (error:any) {
      if(error.code === 11000){
         throw new HttpException(409, "Conflict", "Product already exists in watchlist");
      }
      throw new HttpException(400,"Failed",`Failed to add product to watch list`)
    }
   }
   public async deleteListById(uid:string):Promise<void>{
    try {
      const list = await watchListModel.findByIdAndDelete({uid});
      if(!list) throw new HttpException(404,"Not Found","Watchlist entry not found after deletion");
    }catch(error) {
      throw new HttpException(400,"Failed",`Failed to remove product from watch list `)
    }
   }
   public async getAll(uid:string):Promise<WatchList[]>{
    try {
       const watchList = await watchListModel.find({user:new Types.ObjectId(uid)}).populate("product")
       return watchList;
    } catch (error) {
      throw new HttpException(400,"Failed",`Failed to fetch product from watch list `) 
    }
   }
}

export default WatchListService;