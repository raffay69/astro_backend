import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import express from "express";
import multer from "multer";
import r2 from "../utils/r2.js";
import { blogModel } from "../models/blogModel.js";
import "dotenv/config";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// add a blog (add admin/astrologer middleware later)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const image = req.file;
    const { title, content, author } = req.body;
    if (!image || !title || !content || !author)
      return res.status(400).json({ message: "incomplete data" });

    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `${Date.now()}-${image.originalname}`,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    await r2.send(new PutObjectCommand(uploadParams));
    const imgLink = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uploadParams.Key}`;

    await blogModel.create({
      coverImg: imgLink,
      title,
      content,
      author,
    });

    res.status(200).json({ message: "Blog added successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// delete a blog(add admin/astrologer middleware later)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const promises = [];

    const blog = await blogModel.findById(id);

    if (blog) {
      const imgName = blog.coverImg.split("/").pop();
      promises.push(
        r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: imgName,
          })
        )
      );
    }

    promises.push(blogModel.findByIdAndDelete(id));

    await Promise.all(promises);
    res.status(200).json({ message: "Blog Deleted Successfully" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

//Get all the blogs (with cursor pagination)
router.get("/", async (req, res) => {
  const lastCursor = req.query.lastCursor;
  const limit = Number(req.query.limit) || 10;
  const query =
    lastCursor && lastCursor !== "0"
      ? { createdAt: { $lt: new Date(atob(lastCursor)) } }
      : {};
  let nextCursor = null;

  const blogs = await blogModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1);

  if (blogs.length > limit) {
    nextCursor = blogs[limit - 1].createdAt;
    blogs.pop();
  }

  res.status(200).json({
    blogs,
    lastCursor: btoa(lastCursor),
    nextCursor: nextCursor !== null ? btoa(nextCursor) : nextCursor,
  });
});

// individual blog
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const indvBlog = await blogModel.findById(id);
    res.status(200).json(indvBlog);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
