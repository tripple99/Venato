import { Request,Response,NextFunction } from "express";
import { normalizeUploadError } from "../../utils/cloudinaryErrorHandlers";

export const handleUploadErrors = (middleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: any) => {
      if (err) {
        const normalized = normalizeUploadError(err);

        return res.status(400).json({
          message: normalized.message,
        });
      }
      next();
    });
  };
};