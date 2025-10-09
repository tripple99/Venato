import { Router } from "express";


interface GlobalController{
    path:string;
    router:Router;
}

export default GlobalController