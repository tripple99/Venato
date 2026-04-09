import {z} from "zod"



export const create = z.object({
    targetValue: z.number().min(0),
    condition: z.enum(["equal", "above", "below", "change_pct"]).optional(),
    currency: z.string().min(3).max(3),
    productId: z.string().min(1),
    marketId: z.string().min(1),
    cooldownMinutes: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
})

// export const update = z.object({
//     price: z.number().min(0),
//     currency: z.string().min(3).max(3),
//     product: z.string().min(1),
//     user: z.string().min(1),
// })



export const updateAlert = create.partial();


export const deleteAlert = z.object({
    id: z.string().min(1),
})

// export const getById = z.object({
//     id: z.string().min(1),
// })

// export const getAll = z.object({
    
// })


export default{
    create,
    updateAlert,
    deleteAlert
}