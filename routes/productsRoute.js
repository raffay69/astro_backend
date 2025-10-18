import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import multer from "multer";
import "dotenv/config";
import r2 from "../utils/r2.js";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { productModel } from "../models/productsModel.js";
import { productReviewRatingModel } from "../models/productReviewRatingModel.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//all products (with pagination)
router.get("/", authenticateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      productModel.find().skip(skip).limit(limit),
      productModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({ currPage: page, products, totalPages });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

//indvidial product
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id missing" });
    const product = await productModel.findById(id).populate("rating_reviews");
    res.status(200).json(product);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// add a product
//add admin middleware to all /admin
router.post("/admin", upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { name, desc, price, status } = req.body;

    if (!image || !name || !desc || !price || !status)
      return res.status(400).json({ message: "incomplete data" });

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${Date.now()}-${image.originalname}`,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    await r2.send(new PutObjectCommand(uploadParams));
    const imgLink = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;

    await productModel.create({
      image: imgLink,
      name: name,
      desc: desc,
      status: status,
      price: price,
    });

    res.status(200).json({ message: "Product added successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// update product
router.put("/admin/:id", upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { id } = req.params;
    const { name, desc, price, status } = req.body;
    const promises = [];

    if (!name || !desc || !price || !status)
      return res.status(400).json({ message: "incomplete data" });

    const updatedInfo = { name, desc, price, status };

    if (image) {
      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${Date.now()}-${image.originalname}`,
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      promises.push(
        r2.send(new PutObjectCommand(uploadParams)).then(() => {
          const imgLink = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;
          updatedInfo.image = imgLink;
        })
      );

      const old = await productModel.findById(id);
      if (old.image) {
        const imageName = old.image.split("/").pop();
        promises.push(
          r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: imageName,
            })
          )
        );
      }
    }

    await Promise.all(promises);
    await productModel.findByIdAndUpdate(id, updatedInfo);

    res.status(200).json({ message: "product updated successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// delete product
router.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const promises = [];

    const doc = await productModel.findById(id);
    if (doc.image) {
      const imageName = doc.image.split("/").pop();
      const deleteImg = r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: imageName,
        })
      );
      promises.push(deleteImg);
    }
    const deleteDoc = productModel.findByIdAndDelete(id);
    promises.push(deleteDoc);

    await Promise.all(promises);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// add a review
router.post("/review_rating/:productId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const { productId } = req.params;
    const { rating, review } = req.body;

    if (!productId || !rating || !review)
      return res.status(400).json({ message: "Missing data" });

    const result = await productReviewRatingModel.create({
      productId: productId,
      userId: userId,
      rating: rating,
      review: review,
    });

    await productModel.findByIdAndUpdate(productId, {
      $push: { rating_reviews: result._id },
    });

    res.status(200).json({ message: "Review added successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

//delete a review
router.delete(
  "/review_rating/:productId/:ratingId",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user;
      const { productId, ratingId } = req.params;
      const review = await productReviewRatingModel.findById(ratingId);

      if (review.userId.toString() !== userId.toString())
        return res.status(403).json({ message: "Unauthorized" });

      await Promise.all([
        productReviewRatingModel.findByIdAndDelete(ratingId),
        productModel.findByIdAndUpdate(productId, {
          $pull: { rating_reviews: ratingId },
        }),
      ]);

      res.status(200).json({ message: "Review deleted successfully" });
    } catch (e) {
      console.log(e.message);
      res.status(500).json({ message: e.message });
    }
  }
);

export default router;
