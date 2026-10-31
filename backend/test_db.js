import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

console.log("URI exists:", !!process.env.MONGODB_URI);

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
  });

  console.log("MongoDB Connected!");
  console.log("Database:", mongoose.connection.name);

  await mongoose.disconnect();

} catch (error) {
    if (error.reason) {
        for (const [address, server] of error.reason.servers) {
            console.log("\nServer:", address);
            console.log("Error:", server.error?.name);
            console.log("Message:", server.error?.message);
            console.log("Code:", server.error?.code);
        }
    }
}