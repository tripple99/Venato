import {Types} from "mongoose";
import { AuthRole } from "../auths/auth.interface";
import { AllowedMarkets } from "../auths/auth.interface";

export interface IProfile{
  image?:string,
  fullname:string,
  username?:string,
  uid:Types.ObjectId,
  roles?:AuthRole,
  userMarket?:Types.ObjectId,

}
 