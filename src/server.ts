import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import documentRoutes from "./routes/document.routes";
import morgan from "morgan";
import multer from "multer";

dotenv.config();
const app = express();

app.use("/uploads", express.static("uploads"));
//app.use(cors({ origin: "https://informa-mz.vercel.app/" }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("ERRO GLOBAL:", err);

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        type: "MULTER_ERROR",
        message: err.message,
        field: err.field,
      });
    }

    return res.status(500).json({
      type: "INTERNAL_ERROR",
      message: err.message || "Erro interno do servidor",
    });
  }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
