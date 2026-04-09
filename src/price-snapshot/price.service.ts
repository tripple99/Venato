import HttpException from "../exceptions/http.exception";
import { IPriceSnapshot, IPriceSnapshotCreate } from "./price.interface";
import priceSnapshotModel from "./price.model";
import AlertService from "../alert/alert.service";
import alertModel from "../alert/alert.model";

class PriceSnapshotService{
     private alertService:AlertService = new AlertService();

    public async create(priceSnapshot: IPriceSnapshotCreate): Promise<IPriceSnapshot> {
    try {
        const createdPriceSnapshot = await priceSnapshotModel.create(priceSnapshot);
        await this.alertService.processMatchingAlerts(createdPriceSnapshot);
        return createdPriceSnapshot;
    } catch (error: any) {
    throw new HttpException(
        error.status || 500,
        "failed",
        error.message || "Failed to create price snapshot"
    );
}
}

    public async fetch(priceSnapshot:IPriceSnapshot):Promise<IPriceSnapshot>{
        try {
            const fetchedPriceSnapshot = await priceSnapshotModel.findById(priceSnapshot.id)
            if(!fetchedPriceSnapshot)
                throw new HttpException(404,'Not found','Price snapshot not found')
            return fetchedPriceSnapshot
        }catch (error: any) {
    throw new HttpException(
        error.status || 500,
        "failed",
        error.message || "Failed to create price snapshot"
    );
}
    }

    public async update(id:string,priceSnapshot:Partial<IPriceSnapshot>):Promise<IPriceSnapshot>{
        try {
            const updatedPriceSnapshot = await priceSnapshotModel.findOneAndUpdate({productId:id},priceSnapshot,{new:true})
            if(!updatedPriceSnapshot)
                throw new HttpException(404,'Not found','Price snapshot not found')
            return updatedPriceSnapshot
        } catch (error: any) {
    throw new HttpException(
        error.status || 500,
        "failed",
        error.message || "Failed to create price snapshot"
    );
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
