import {z} from "zod";
import { Market } from "./market.interface";


const geolocationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
});

// ILocation
const locationSchema = z.object({
  state: z.string(),
  code: z.string(),
  LGA: z.string(),
  country: z.string(),
  cordinates: geolocationSchema.optional(),
});


const createMarket = z.object({
   name:z.nativeEnum(Market),
   currency: z.string().regex(/^NGN$/,{
  message: "Currency must be NGN",
}),

 location:locationSchema,
})
const updateMarket = z.object({
   marketName:z.nativeEnum(Market),
   location:locationSchema,
}) 

export default{
  createMarket,
  updateMarket
}