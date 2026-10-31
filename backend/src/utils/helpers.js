import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ApiError from './ApiError.js';

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const assertObjectId = (id, label = 'id') => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`);
};

export const removeUploadedFile = (relativePath) => {
  if (!relativePath) return;
  const abs = path.join(process.cwd(), relativePath.replace(/^\//, ''));
  fs.promises.unlink(abs).catch(() => {});
};

export const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const lastMonthKeys = (count) => {
  const keys = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
};

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export const monthRange = (key) => {
  const [y, m] = key.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

export const startOfMonthsAgo = (count) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));
};

export const daysBetween = (a, b) => Math.floor((new Date(a) - new Date(b)) / 86400000);
