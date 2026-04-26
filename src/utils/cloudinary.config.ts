  import {v2 as cloudinary} from 'cloudinary';
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  import dotenv from 'dotenv';
  import multer from 'multer';
  import { Request } from 'express';
  import { createFileFilter } from '../helpers/upload-file-filters';
  import logger from './logger';
  dotenv.config();

  cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

export const createUploader = (options: {
  folder: string; // e.g., "documents"
  allowedFormats: string[];
  fileSizeLimitMB: number;
}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req: Request, file: Express.Multer.File) => {
      try {
        const uid = req.user?.id;
        // Clean up folder paths: remove leading/trailing slashes from base folder, 
        // then join with UID if available.
        const baseFolder = options.folder.replace(/^\/+|\/+$/g, '');
        const uploadFolder = uid ? `${baseFolder}/${uid}` : baseFolder;

        return {
          folder: uploadFolder,
          resource_type: "image",
          format: "jpg", 
          allowed_formats: options.allowedFormats.map(fmt => fmt.split('/')[1] || fmt),
        };
      } catch (error) {
        logger.error("Cloudinary Params Error:", error);
        throw error;
      }
    },
  });

  return multer({
    storage,
    fileFilter: createFileFilter(options.allowedFormats),
    limits: {
      fileSize: options.fileSizeLimitMB * 1024 * 1024,
    },
  });
};
