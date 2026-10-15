import { mkdir } from "node:fs/promises";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const uploadRoot = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : fileURLToPath(new URL("../uploads/", import.meta.url));
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

await Promise.all([
  mkdir(path.join(uploadRoot, "properties"), { recursive: true }),
  mkdir(path.join(uploadRoot, "profiles"), { recursive: true }),
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const folder = file.fieldname === "profilePic" ? "profiles" : "properties";
    callback(null, path.join(uploadRoot, folder));
  },
  filename(req, file, callback) {
    callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter(req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, WebP, and GIF images are supported."));
      return;
    }
    callback(null, true);
  },
});

export const propertyImages = upload.array("images", 10);
export const profileImage = upload.single("profilePic");
export { uploadRoot };
