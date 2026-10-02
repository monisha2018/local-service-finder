import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${(req as any).user?.id || "anon"}-${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed."));
    }
    cb(null, true);
  },
});