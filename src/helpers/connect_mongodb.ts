import mongoose from "mongoose";


async function connectDB(){
    const options = {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
      };
      const {MONGO_URI,MONGO_PASSWORD,MONGO_USER} = process.env
      let connectedString:string;
   try {
    
   if(!MONGO_URI){
      console.error("URI isn't defined");
    }

    connectedString = MONGO_URI ?? 'mongodb://localhost:27017/Venato';

    
    mongoose.connection.on('connected',()=>{
      console.log("MongoDB conntection succesfully established 🛜")
    })
    mongoose.connection.on('error', (err)=>{
      console.log(`Error whilst connecting DB ${err.message}`)
    })
    mongoose.connection.on("disconnected",()=>{
      console.log("MongoDB connection disconnected ❌")
    })
  
    await mongoose.connect(connectedString,options)
   } catch (error:any) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error(`Error name: ${error.name}, code: ${error.code}`);
    console.error(`Stack trace: ${error.stack}`);
   } 
 
} 

export default connectDB;