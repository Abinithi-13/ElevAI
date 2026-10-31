import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXT[file.mimetype]}`),
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXT[file.mimetype]) return cb(new ApiError(400, 'Only JPG, PNG or WebP images are allowed'));
    return cb(null, true);
  },
}).single('image');
