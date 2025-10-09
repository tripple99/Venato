import { Schema,model} from "mongoose";
import { IProfile } from "./profile.interface"
import { AuthRole } from "../auths/auth.interface";



const profile = new Schema<IProfile>({
  image:{type:String,required:false},
  fullname:{type:String},
  username:{type:String},
})



export default model<IProfile>("Profile",profile)