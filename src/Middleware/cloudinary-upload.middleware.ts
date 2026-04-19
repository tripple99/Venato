import { createUploader } from "../utils/cloudinary.config";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

/**
 * Middleware to handle uploads for profile verification documents.
 * Accepts identity, affiliation, and license photos/videos.
 */
export const uploadProductImageMiddleware = createUploader({
  folder: "products/",
  allowedFormats: ACCEPTED_IMAGE_TYPES,
  fileSizeLimitMB: 5,
}).fields([{ name: "image", maxCount: 5 }]);

export const uploadProfilePictureMiddleware = createUploader({
  folder: "profile-pictures/",
  allowedFormats: ACCEPTED_IMAGE_TYPES,
  fileSizeLimitMB: 5,
}).single("profilePicture");

export const uploadProductVideoMiddleware = createUploader({
  folder: "products/videos/",
  allowedFormats: ["video/mp4", "video/webm", "video/quicktime"],
  fileSizeLimitMB: 100,
}).single("video");
