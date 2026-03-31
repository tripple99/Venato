import {z} from "zod"



export const create = z.object({
    price: z.number().min(0),
    currency: z.string().min(3).max(3),
    product: z.string().min(1),
    user: z.string().min(1),
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