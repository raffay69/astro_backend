import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_ACCESS__KEY,
  },
});

export default r2;
