import { z } from "zod";

const geolocationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
});

// ILocation
const locationSchema = z.object({
  state: z.string(),
  code: z.string(),
  LGA: z.string().optional(),
  country: z.string(),
  coordinates: geolocationSchema.optional(),
  cordinates: geolocationSchema.optional(),
});

const createMarket = z.object({
  name: z.string(),
  currency: z.string().regex(/^NGN$/, {
    message: "Currency must be NGN",
  }),
  location: locationSchema,
  isActive: z.boolean().optional(),
});

const updateMarket = z.object({
  name: z.string().optional(),
  currency: z
    .string()
    .regex(/^NGN$/, {
      message: "Currency must be NGN",
    })
    .optional(),
  location: locationSchema.partial().optional(),
  isActive: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
});

export default {
  createMarket,
  updateMarket,
};
