import HttpException from "../exceptions/http.exception";
import { IPriceSnapshot, IPriceSnapshotCreate } from "./price.interface";
import priceSnapshotModel from "./price.model";
import inventoryModel from "../inventory/inventory.model";
import { Types } from "mongoose";


class PriceSnapshotService{


    public async create(priceSnapshot:IPriceSnapshotCreate):Promise<IPriceSnapshot>{
        try {
            const createdPriceSnapshot = await priceSnapshotModel.create(priceSnapshot)
            return createdPriceSnapshot
        } catch (error) {
            throw new HttpException(400,'failed',`failed to create price snapshot`)
        }
    }

    public async fetch(priceSnapshot:IPriceSnapshot):Promise<IPriceSnapshot>{
        try {
            const fetchedPriceSnapshot = await priceSnapshotModel.findById(priceSnapshot._id)
            if(!fetchedPriceSnapshot)
                throw new HttpException(404,'Not found','Price snapshot not found')
            return fetchedPriceSnapshot
        } catch (error) {
            throw new HttpException(400,'failed',`failed to fetch price snapshot`)
        }
    }

    public async update(priceSnapshot:IPriceSnapshot):Promise<IPriceSnapshot>{
        try {
            const updatedPriceSnapshot = await priceSnapshotModel.findByIdAndUpdate(priceSnapshot._id,priceSnapshot,{new:true})
            if(!updatedPriceSnapshot)
                throw new HttpException(404,'Not found','Price snapshot not found')
            return updatedPriceSnapshot
        } catch (error) {
            throw new HttpException(400,'failed',`failed to update price snapshot`)
        }
    }

    // public async delete(priceSnapshot:IPriceSnapshot):Promise<IPriceSnapshot>{
    //     try {
    //         const deletedPriceSnapshot = await priceSnapshotModel.findByIdAndDelete(priceSnapshot._id)
    //         if(!deletedPriceSnapshot)
    //             throw new HttpException(404,'Not found','Price snapshot not found')
    //         return deletedPriceSnapshot
    //     } catch (error) {
    //         throw new HttpException(400,'failed',`failed to delete price snapshot`)
    //     }
    // }



}

export default PriceSnapshotService
