import fs from "fs";
import path from "path";
import multer from "multer";

const createStorage = (folderName) => {
  const uploadDir = path.join(process.cwd(), "uploads", folderName);
  fs.mkdirSync(uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const safeBase = path
        .basename(file.originalname, extension)
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase();
      cb(null, `${Date.now()}-${safeBase}${extension}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only PDF, JPG, PNG, and WEBP documents are allowed"));
};

export const uploadProviderProof = multer({
  storage: createStorage("id-proofs"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadProviderRegistration = multer({
  storage: createStorage("provider-registration"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadProblemImage = multer({
  storage: createStorage("booking-problems"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadCompletionProof = multer({
  storage: createStorage("booking-completion"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
