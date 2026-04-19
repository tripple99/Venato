import {z} from "zod"
import { IUnit,ICategory } from "./product.interface"



// const prodcutCat = z.object({
   
// })

const createProduct = z.object({
  name:z.string().min(1,"Product name required"),
  unit:z.nativeEnum(IUnit),
  price: z.string().min(1, { message: "Price required" }).transform((val) => Number(val)),
  category: z.nativeEnum(ICategory),
  quantityAvailable:z.string().min(1,{message:"Quantity available required" }).transform((val) => Number(val)),
  description:z.string().min(1,"Descrition required").optional(),
  marketId:z.string().min(1,"Market ID required"),
  images:z.array(z.string()).max(5,"Maximum 5 images allowed").optional(),
}) 
const updateProduct = z.object({
  name:z.string().min(1,"Product name required").optional(),
  unit:z.enum(IUnit).optional(),
  price: z.number().min(0, { message: "Number can't be less than 0" }).optional().transform((val) => Number(val)),
  category: z.nativeEnum(ICategory).optional(),
  quantityAvailable:z.number().min(0,{message:"Number can't be less than 0" }).optional().transform((val) => Number(val)),
  description:z.string().min(1,"Descrition required").optional(),
  marketId:z.string().min(1,"Market ID required"),
  images:z.array(z.string()).max(5,"Maximum 5 images allowed").optional(),
})


export default {createProduct,updateProduct}