import { Schema,model } from "mongoose";
import { OTP } from "./opt.protocol";



const opt = new Schema<OTP>({
   uid:{type:String,required:true},
   otp:{type:String,required:true},
   createdAt: { type: Date, default: Date.now },
   expiresAt: { type: Date, required: true },
   isVerified: { type: Boolean, default: false },
 
},{
  timestamps:true
})

export default model<OTP>("OPT",opt);