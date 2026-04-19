import multer from "multer";
import HttpException from "../exceptions/http.exception";

/**
 * Creates a Multer file filter that restricts uploads to specific MIME types.
 * @param allowedMimeTypes - List of allowed MIME types.
 */
declare global {
  namespace Express {
    interface Request {
      file: Express.Multer.File;
    }
  }
}
export const createFileFilter =
  (allowedMimeTypes: string[]) =>
    (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new HttpException(
            400,
            "Upload failed",
            `Unsupported file type: ${file.mimetype}`
          )
        );
      }
    };
