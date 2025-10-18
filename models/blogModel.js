import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema(
  {
    author: {
      type: String,
      required: true,
    },
    coverImg: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const blogModel = mongoose.model("Blog", blogSchema);
