import mongoose from "mongoose";
import logger from "../utils/logger";



async function connectDB(){
    const options = {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
      };
      const {MONGO_PROD_URI,NODE_ENV,MONGO_URI} = process.env
      let connectedString:string;
   try {
    
   if(!MONGO_URI && !MONGO_PROD_URI){
      logger.error("URI isn't defined");
    }

    connectedString = (NODE_ENV === "production") ? MONGO_PROD_URI : MONGO_URI;

    
    mongoose.connection.on('connected',()=>{
      logger.info("MongoDB conntection succesfully established 🛜")
    })
    mongoose.connection.on('error', (err)=>{
      logger.error(`Error whilst connecting DB ${err.message}`)
    })
    mongoose.connection.on("disconnected",()=>{
      logger.info("MongoDB connection disconnected ❌")
    })
  
    await mongoose.connect(connectedString,options)
   } catch (error:any) {
    logger.error(`MongoDB connection error: ${error.message}`, {
        name: error.name,
        code: error.code,
        stack: error.stack
    });
   } 
 
} 

export default connectDB;