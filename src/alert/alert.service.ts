import HttpException from "../exceptions/http.exception";
import { IAlert } from "./alert.interface";
import alertModel from "./alert.model";
import { IPriceSnapshot } from "../price-snapshot/price.interface";

class AlertService {

    
    async createAlert(alert: IAlert) {
        try {
            const {productId,price,market,user,currency} = alert;
            const newAlert = new alertModel({
                productId,
                price,
                market:market,
                user:user,
                currency:currency
            });
            return await newAlert.save();
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to create an alert");
        }
    }

    async getAlerts() {
        try {
            return await alertModel.find();
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to get alerts");
        }
    }

    async getAlertById(id: string) {
        try {
            return await alertModel.findById(id);
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to get an alert");
        }
    }

    async updateAlert(id: string, alert: IAlert) {
        try {
            return await alertModel.findByIdAndUpdate(id, alert, { new: true });
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to update an alert");
        }
    }

    async deleteAlert(id: string) {
        try {
            return await alertModel.findByIdAndDelete(id);
        } catch (error) {
            throw new HttpException(400, "Failed","Failed to delete an alert");
        }
    }

 async processMatchingAlerts(snapshot: IPriceSnapshot): Promise<void> {
   const matchingAlerts = await alertModel.find({
      productId: snapshot.productId,
      price: snapshot.price
   });

   await Promise.all(
      matchingAlerts.map(alert => this.deleteAlert(alert.id))
   );
}
}

export default  AlertService;