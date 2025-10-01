import express from "express";
import "dotenv/config";
import productRoutes from "./routes/productsRoute";
import servicesRoutes from "./routes/servicesRoute";

const app = express();

const PORT = process.env.PORT || 4000;

app.use("/products", productRoutes);
app.use("/services", servicesRoutes);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
