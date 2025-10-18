import express from "express";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import { serviceModel } from "../models/servicesModel.js";
import multer from "multer";
import "dotenv/config";
import r2 from "../utils/r2.js";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { serviceReviewRatingModel } from "../models/serviceReviewRatingModel.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

//all services (with pagination)
router.get("/", authenticateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [services, totalCount] = await Promise.all([
      serviceModel.find().skip(skip).limit(limit),
      serviceModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({ currPage: page, services, totalPages });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

//indvidial service
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id missing" });
    const service = await serviceModel.findById(id).populate("rating_reviews");
    res.status(200).json(service);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// create service
//add admin middleware to all /admin
router.post("/admin", upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { name, desc, price } = req.body;

    if (!image || !name || !desc || !price)
      return res.status(400).json({ message: "incomplete data" });

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${Date.now()}-${image.originalname}`,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    await r2.send(new PutObjectCommand(uploadParams));
    const imgLink = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;

    await serviceModel.create({
      image: imgLink,
      name: name,
      desc: desc,
      price: price,
    });

    res.status(200).json({ message: "Service added successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// update service
router.put("/admin/:id", upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { id } = req.params;
    const { name, desc, price } = req.body;

    if (!name || !desc || !price)
      return res.status(400).json({ message: "incomplete data" });

    const updatedInfo = { name, desc, price };

    if (image) {
      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `${Date.now()}-${image.originalname}`,
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      await r2.send(new PutObjectCommand(uploadParams));
      const imgLink = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;
      updatedInfo.image = imgLink;

      const old = await serviceModel.findById(id);
      if (old.image) {
        const imageName = old.image.split("/").pop();
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: imageName,
          })
        );
      }
    }

    await serviceModel.findByIdAndUpdate(id, updatedInfo);

    res.status(200).json({ message: "Service updated successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// delete service
router.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const promises = [];

    const doc = await serviceModel.findById(id);
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
    const deleteDoc = serviceModel.findByIdAndDelete(id);
    promises.push(deleteDoc);

    await Promise.all(promises);

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: e.message });
  }
});

// add a review
router.post("/review_rating/:serviceId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user;
    const { serviceId } = req.params;
    const { rating, review } = req.body;

    if (!serviceId || !rating || !review)
      return res.status(400).json({ message: "Missing data" });

    const result = await serviceReviewRatingModel.create({
      serviceId: serviceId,
      userId: userId,
      rating: rating,
      review: review,
    });

    await serviceModel.findByIdAndUpdate(serviceId, {
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
  "/review_rating/:serviceId/:ratingId",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user;
      const { serviceId, ratingId } = req.params;
      const review = await serviceReviewRatingModel.findById(ratingId);

      if (review.userId.toString() !== userId.toString())
        return res.status(403).json({ message: "Unauthorized" });

      await Promise.all([
        serviceReviewRatingModel.findByIdAndDelete(ratingId),
        serviceModel.findByIdAndUpdate(serviceId, {
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
