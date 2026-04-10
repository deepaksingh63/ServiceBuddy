import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error("Message:", error.message);
    if (error.name) {
      console.error("Name:", error.name);
    }
    if (error.code) {
      console.error("Code:", error.code);
    }
    if (error.reason?.code) {
      console.error("Reason code:", error.reason.code);
    }
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
};
