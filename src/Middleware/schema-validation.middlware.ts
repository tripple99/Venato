import { Request,Response,NextFunction, RequestHandler } from "express";
import { ZodError, ZodType } from "zod";








function schemaValidator(schema:ZodType<any,any,any>):RequestHandler{
  return async(
    req:Request,
    res:Response,
    next:NextFunction
  ):Promise<void>=>{

    try {
        const data = req.body;

        const validatedData = await schema.parseAsync(data);

        req.body = validatedData;
        next()     
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));

        res.status(400).send({
          message: "Validation Failed",
          status: "error",
          payload: errors,
        });
      } else {
        // Handle other errors
        res.status(500).send({
          message: "Internal Server Error",
          status: "error",
          payload: error instanceof Error ? error.message : "Unknown error",
        });
      }
     
    }

  }
}

export default schemaValidator;