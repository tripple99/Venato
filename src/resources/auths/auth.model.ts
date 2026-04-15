import mongoose from "mongoose";
import { model, Schema ,Types} from "mongoose";
import {
  IAuth,
  AuthRole,
  AllowedMarkets,
  OauthProvider,
} from "./auth.interface";
import bcrypt from "bcrypt";

const AuthSchema = new Schema<IAuth>({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true ,
    
  },
  userRole: {
    type: String,
    enum: Object.values(AuthRole),
    default: AuthRole.User,
  },
 allowedMarkets: {
    type: [{ type: Schema.Types.ObjectId, ref: "Markets" }],
    default: undefined, // Field won't exist in DB unless populated
    validate: {
      validator: function (markets: Types.ObjectId[]) {
        // If the user is a normal 'User', they cannot have markets assigned
        if (this.userRole === AuthRole.User && markets && markets.length > 0) {
          return false; 
        }
        return true;
      },
      message: "Normal users cannot have assigned markets.",
    },
  },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String, default: "" },
  sessionToken: { type: String, default: null },
  // activity tracking
  isActive: { type: Boolean, default: false },
  lastActive: { type: Date, default: null },
  // Oauth2: { type: Oauth2Schema, default: null,required:false }
}, { timestamps: true });



AuthSchema.pre<IAuth>("save", async function (next) {
  if (this.isModified("password")) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
  next();
});
AuthSchema.methods.isValidPassword = async function (
  password: string,
): Promise<Error | boolean> {
  return bcrypt.compare(password, this.password);
};

export default model<IAuth>("Auth", AuthSchema);
