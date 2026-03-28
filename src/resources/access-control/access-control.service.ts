import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import { IAuth,AllowedMarkets,AuthRole} from "../auths/auth.interface";
import profileModel from "../profile/profile.model";



class AccessControlService{

public async grantAccess(uid:string,data:Partial<IAuth>):Promise<IAuth>{
     try {
      const isVerified = await authModel.findById(uid)
      if(!isVerified?.isVerified) throw new HttpException(404,"Not found","User doesn't exist")
      const user  = await authModel.findByIdAndUpdate(uid,{$set:{
        userRole:data.userRole,
        allowedMarkets:data.allowedMarkets,
     
      }},{new:true});
      const profile = await profileModel.findByIdAndUpdate(uid,{$set:{
        userRole:data.userRole,
        allowedMarkets:data.allowedMarkets,
      }},{new:true});
      if(!user) throw new HttpException(404,"Not found","User doesn't exist")
      return user 
     } catch (error) {
       throw new HttpException(404,"failed",`Failed to grant role ${error}`)
     }
  }


public async revokeAccess(uid:string):Promise<IAuth>{
  try {
     const user = await authModel.findById(uid)
     if(!user) throw new HttpException(404,"Not found","User doesn't exist")
      user.userRole = null as any;
      user.allowedMarkets = [] as any;
      const profile = await profileModel.findByIdAndUpdate(uid,{$set:{
        userRole:null as any,
        allowedMarkets:[] as any,
     
      }},{new:true});
      return await user.save();
  } catch (error) {
     throw new HttpException(404,"failed",`Failed to revoke user access ${error}`)
  }
}
}


export default AccessControlService;

