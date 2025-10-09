import {z} from "zod"




const updateProfile = z.object({
   fullname:z.string().min(1,"Full name is required").optional(),
   username:z.string().min(1,"User name is required").optional(),
})


export default{
  updateProfile
}