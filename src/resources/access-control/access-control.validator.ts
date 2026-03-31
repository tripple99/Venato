import { IAuth,AuthRole,AllowedMarkets} from "../auths/auth.interface";
import {z} from "zod";





const grantAccess = z.object({
  userRole: z.nativeEnum(AuthRole),
})

const revokeAccess = z.object({
  userRole: z.nativeEnum(AuthRole),
  allowedMarkets:z.nativeEnum(AllowedMarkets),

})




export default {
  grantAccess,
  revokeAccess
}