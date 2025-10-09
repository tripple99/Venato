import {z} from "zod"
import { IUnit,ICategory } from "./product.interface"



// const prodcutCat = z.object({
   
// })

const createProduct = z.object({
  name:z.string().min(1,"Product name required"),
  unit:z.nativeEnum(IUnit),
  price: z.number().min(0, { message: "Number can't be less than 0" }),
  category: z.nativeEnum(ICategory),
  quantityAvailable:z.number().min(0,{message:"Number can't be less than 0" }).optional(),
  description:z.string().min(1,"Descrition required").optional(),
  // marketId:z.string().min(1,"Market ID required")

}) 
const updateProduct = z.object({
  name:z.string().min(1,"Product name required").optional(),
  unit:z.enum(IUnit).optional(),
  price: z.number().min(0, { message: "Number can't be less than 0" }).optional(),
  category: z.nativeEnum(ICategory).optional(),
  quantityAvailable:z.number().min(0,{message:"Number can't be less than 0" }).optional(),
  description:z.string().min(1,"Descrition required").optional(),
})


export default {createProduct,updateProduct}