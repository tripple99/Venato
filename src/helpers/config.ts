import dotenv from 'dotenv';

dotenv.config()


export const config = {
    env:process.env.NODE_ENV || 'developement',
    port:Number(process.env.PORT) || 4000,
    base_url:'http://localhost:3000',
}


export const sessionConfig = {
    secret:process.env.SESSION_SECRET || "",
    resave:false,
    saveUninitialized: false,
    store:undefined,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60000 * 60 * 24 // 1 day
    }
}