import mongoose from "mongoose";
import "dotenv/config";

export async function initDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
  } catch (e) {
    console.log("error connecting to db", e.message);
  }
}
