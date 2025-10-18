import express from "express";
import "dotenv/config";
import productRoutes from "./routes/productsRoute.js";
import scanningRoutes from "./routes/scanningRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import serviceRoutes from "./routes/servicesRoute.js";
import blogRoutes from "./routes/blogRoutes.js";
import { initDB } from "./models/initDB.js";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json({ limit: "10mb" }));

app.use("/products", productRoutes);
app.use("/services", serviceRoutes);
app.use("/scanning", scanningRoutes);
app.use("/cart", cartRoutes);
app.use("/blog", blogRoutes);

initDB();
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
