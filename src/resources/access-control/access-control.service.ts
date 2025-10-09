import HttpException from "../../exceptions/http.exception";
import authModel from "../auths/auth.model";
import { IAuth,AllowedMarkets,AuthRole} from "../auths/auth.interface";




class AccessControlService{

public async grantAccess(uid:string,data:Partial<IAuth>):Promise<IAuth>{
     try {
      const user  = await authModel.findByIdAndUpdate(uid,{$set:data},{new:true});
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
      return await user.save();
  } catch (error) {
     throw new HttpException(404,"failed",`Failed to revoke user access ${error}`)
  }
}
}


export default AccessControlService;

