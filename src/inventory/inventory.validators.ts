import z from "zod";


export const create = z.object({
    productId:z.string().min(1,"Product ID is required"),
    quantity:z.number().min(1,"Quantity is required"),
    unit:z.string().min(1,"Unit is required"),
    preferredMarket:z.string().min(1,"Preferred Market is required"),
})

export const update = z.object({
    productId:z.string().min(1,"Product ID is required"),
    quantity:z.number().min(1,"Quantity is required"),
    unit:z.string().min(1,"Unit is required"),
    preferredMarket:z.string().min(1,"Preferred Market is required"),
})

export const deleteInventory = z.object({
    productId:z.string().min(1,"Product ID is required"),
    quantity:z.number().min(1,"Quantity is required"),
    unit:z.string().min(1,"Unit is required"),
    preferredMarket:z.string().min(1,"Preferred Market is required"),
})

export const fetch = z.object({
    productId:z.string().min(1,"Product ID is required"),
    quantity:z.number().min(1,"Quantity is required"),
    unit:z.string().min(1,"Unit is required"),
    preferredMarket:z.string().min(1,"Preferred Market is required"),
})

export const fetchById = z.object({
    productId:z.string().min(1,"Product ID is required"),
    quantity:z.number().min(1,"Quantity is required"),
    unit:z.string().min(1,"Unit is required"),
    preferredMarket:z.string().min(1,"Preferred Market is required"),
})


export default {
    create,
    update,
    deleteInventory,
    fetch,
    fetchById
}


