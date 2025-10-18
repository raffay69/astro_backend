import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    image: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      required: true,
    },
    rating_reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProductReviewRating",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const productModel = mongoose.model("Product", productSchema);
