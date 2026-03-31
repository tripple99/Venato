import { Schema,model } from "mongoose";
import { OTP, OtpPurpose } from "./opt.protocol";



// Update your schema file
const opt = new Schema<OTP>({
   uid: { type: String, required: true },
   otp: { type: String, required: true },
   purpose: { type: String, enum: Object.values(OtpPurpose), required: true },
   expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete on expiry
   isVerified: { type: Boolean, default: false },
}, {
   timestamps: true
});

export default model<OTP>("OTP", opt);