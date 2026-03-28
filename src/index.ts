import dotenv from 'dotenv';
import 'dotenv/config';
import App from "./app";
import validateEnv from './utils/validate-env';
import connectDB from './helpers/connect_mongodb';


import AuthControllers from "./resources/auths/auth.controller"
import MarketController from './resources/markets/market.controllers'
import ProductController from './resources/products/product.controller';
import AccessController from './resources/access-control/access-control.controller';
import StatsController from './resources/stats/stats.controller';
import ProfileController from  './resources/profile/profile.controller';
import WatchListControllers from './resources/watch-List/watch-list.controller';
import InventoryController from './inventory/inventory.controller';


  









require("dotenv").config();

process.on("uncaughtExceptions",(error)=>{
  console.error("Uncaught exception",error);
  process.exit(1)
})



process.on("unhandledRejections",(reason)=>{
    console.error(`
        
        `)

})



try {
    validateEnv()
} catch(error) {
    console.error("Missing Environment Variables")
}

async function startApp() {
    try {
      await connectDB()

        const port = Number(process.env.PORT) || 4000;
            const app = new App(
                [
                    new AuthControllers(),
                    new MarketController(),
                    new ProductController(),
                    new AccessController(),
                    new StatsController(),
                    new ProfileController(),
                    new WatchListControllers(),
                    new InventoryController(),
                ], 
                port,
            )

            app.listen();
            console.log(`🚀 Server is running at ${process.env.baseUrl || `http://localhost:${port}`}`);
    } catch (error) {
        console.error('fialed to started Application',error)
    }




}


startApp();



