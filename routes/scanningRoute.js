import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { FaceSystemPrompt, PalmSystemPrompt } from "../prompts.js";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

//the images needs to be sent as "base64" encoded form
router.post("/face", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: FaceSystemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Please analyze this face." },
            {
              type: "input_image",
              image_url: imageBase64,
            },
          ],
        },
      ],
    });
    console.log(response.output_text);
    res.json({ result: response.output_text });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/hand", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: PalmSystemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Please analyze this Palm." },
            {
              type: "input_image",
              image_url: `${imageBase64}`,
            },
          ],
        },
      ],
    });
    console.log(response.output_text);
    res.json({ result: response.output_text });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
