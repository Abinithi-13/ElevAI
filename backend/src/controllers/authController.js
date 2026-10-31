import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../middleware/auth.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, building } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');

  // Public registration always creates a building user. Admins create technicians.
  const user = await User.create({ name, email, password, phone, building, role: 'user' });
  res.status(201).json({ token: signToken(user), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');
  res.json({ token: signToken(user), user });
});

export const me = asyncHandler(async (req, res) => res.json({ user: req.user }));
