import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

export const cartModel = mongoose.model("Cart", cartSchema);
