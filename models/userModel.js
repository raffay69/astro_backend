import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  //.... add rest of the fields
  cart: [
    {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
  ],
});

export const userModel = mongoose.model("User", userSchema);
