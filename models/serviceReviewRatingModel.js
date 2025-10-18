import mongoose, { Schema } from "mongoose";

const serviceReviewRatingSchema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const serviceReviewRatingModel = mongoose.model(
  "ServiceReviewRating",
  serviceReviewRatingSchema
);
