/**
 * Creates (or promotes) an admin account without touching other data.
 * Usage: npm run create-admin -- "Your Name" you@example.com YourPassword123
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';

const [name, email, password] = process.argv.slice(2);

async function run() {
  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- "Full Name" email@example.com Password123');
    process.exit(1);
  }
  if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
    console.error('Password must be at least 8 characters and include a letter and a number.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.role = 'admin';
    existing.isActive = true;
    existing.password = password; // hashed automatically on save
    await existing.save();
    console.log(`Existing account ${existing.email} promoted to admin and password updated.`);
  } else {
    const admin = await User.create({ name, email, password, role: 'admin' });
    console.log(`Admin created: ${admin.email}`);
  }
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});