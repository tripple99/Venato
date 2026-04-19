

export const normalizeUploadError = (err: any) => {
  // Multer errors
  if (err?.code === "LIMIT_FILE_SIZE") {
    return new Error("File too large. Max size exceeded.");
  }

  if (err?.message === "Unexpected field") {
    return new Error("Invalid file field.");
  }

  // Cloudinary errors
  if (err?.http_code) {
    return new Error(`Upload failed: ${err.message}`);
  }

  // File filter errors
  if (err?.message?.includes("Invalid file type")) {
    return new Error(err.message);
  }

  return new Error(err?.message || "Upload failed");
};





