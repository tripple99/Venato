import { Schema,model} from "mongoose";
import { IProfile } from "./profile.interface"
import { AuthRole,AllowedMarkets } from "../auths/auth.interface";



const profile = new Schema<IProfile>({
  image:{type:String,required:false},
  fullname:{type:String},
  username:{type:String},
  uid:{type:Schema.Types.ObjectId,ref:"Auth",required:true},
  roles:{type:String,enum:Object.values(AuthRole),default:AuthRole.User},
  
  userMarket:{
    type:Schema.Types.ObjectId,
    ref:"Markets",
    default:null,
  }
})



export default model<IProfile>("Profile",profile)