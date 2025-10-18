import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { userModel } from "../models/userModel.js";
import { cartModel } from "../models/cartModel.js";

const router = express.Router();

// get all cart items
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const cart = await userModel.findById(userId).populate({
      path: "cart",
      populate: {
        path: "productId",
      },
    });
    res.status(200).json(cart);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// add item in cart
router.post("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.body;
    const cartItem = await cartModel.create({
      userId: userId,
      productId: productId,
      quantity: 1,
    });
    await userModel.findByIdAndUpdate(userId, {
      $push: { cart: cartItem._id },
    });
    res.status(200).json({ message: "item added in cart" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

//increment quantity of an item
router.patch("/inc/:productId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.params;

    await cartModel.findOneAndUpdate(
      { userId, productId },
      { $inc: { quantity: 1 } }
    );

    res.status(200).json({ message: "Quantity increased" });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ message: e.message });
  }
});

// decrement item quantity / remove item
router.patch("/dnc/:productId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.params;

    const cartItem = await cartModel.findOne({ userId, productId });

    if (cartItem.quantity <= 1) {
      //Remove the item if it goes to 0
      await cartModel.deleteOne({ _id: cartItem._id });
      await userModel.findByIdAndUpdate(userId, {
        $pull: { cart: cartItem._id },
      });
      return res.status(200).json({ message: "Item removed from cart" });
    }

    //decrement quantity
    cartItem.quantity -= 1;
    await cartItem.save();

    res.status(200).json({ message: "Quantity decreased" });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ message: e.message });
  }
});

export default router;
