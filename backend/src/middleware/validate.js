import { validationResult } from 'express-validator';
import { removeUploadedFile } from '../utils/helpers.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  if (req.file) removeUploadedFile(`uploads/${req.file.filename}`);
  const list = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(422).json({ message: list[0].message, errors: list });
};
