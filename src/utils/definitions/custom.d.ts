import { TokenPayload } from "../../Middleware/auths";


export{ };

declare global {
    namespace Express {
      // Override the default IAuth interface from passport
       export interface IAuth extends TokenPayload { }
  
      export interface Request {
        user?: TokenPayload; // Use the TokenPayload interface from auth.middleware
        market:string[];
      }
    }
  }
  