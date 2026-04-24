import {Request,Response,NextFunction} from "express";
import HttpException from "../exceptions/http.exception";
import logger from "../utils/logger";



function errorMiddleware(error:HttpException,req:Request,res:Response,_next :NextFunction){
    logger.error(`Error processing path: ${req.path} method: ${req.method}`, {
        error: error.message,
        stack: error.stack
    });

    const status = error.status || "error";
    const statusCode = error.statusCode || 500;
    const message = error.message || "Something went wrong";
    

    if(error instanceof HttpException){
        const response = {
            status,
            success: false,
            message,
            ...(error.errors ? { errors: error.errors } : {}),
            // ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
          };
      
          res.status(statusCode).json(response);
          return;
    }
    res.status(500).json({
        status: "error",
        success: false,
        message: 'Internal Server Error'
      });
      return;
}

export default errorMiddleware