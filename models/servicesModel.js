import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
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
    rating_reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "ServiceReviewRating",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const serviceModel = mongoose.model("Service", serviceSchema);
