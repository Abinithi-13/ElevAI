import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);
};
