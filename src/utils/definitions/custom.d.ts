import { TokenPayload } from "../../Middleware/auths";


export{ };

declare global {
    namespace Express {
      // Override the default IAuth interface from passport
      export interface IAuth extends TokenPayload { }

      // Define the missing Multer namespace and its File interface
      namespace Multer {
        export interface File {
          /** Name of the form field associated with the file. */
          fieldname: string;
          /** Name of the file on the uploader's computer. */
          originalname: string;
          /** Value of the `Content-Transfer-Encoding` header for this file. */
          encoding: string;
          /** Value of the `Content-Type` header for this file. */
          mimetype: string;
          /** Size of the file in bytes. */
          size: number;
          /** `DiskStorage` only: Directory to which this file has been uploaded. */
          destination: string;
          /** `DiskStorage` only: Name of this file within `destination`. */
          filename: string;
          /** `DiskStorage` only: Full path to the uploaded file. */
          path: string;
          /** `MemoryStorage` only: A Buffer containing the entire file. */
          buffer: Buffer;
        }
      }

      export interface Request {
        user?: TokenPayload; // Use the TokenPayload interface from auth.middleware
        market: string[];
        file: Express.Multer.File;
        files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
      }
    }
  }
  