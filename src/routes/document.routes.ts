import { Router } from "express";
import {
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controller/document.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadPhotos } from "../controller/document.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// All document actions require authentication
router.get("/", getDocument);
router.post("/", authMiddleware, createDocument);
router.put("/:id", authMiddleware, updateDocument);
router.delete("/:id", authMiddleware, deleteDocument);

router.post(
  "/:id/photos",
  authMiddleware,
  upload.array("photos", 4), // máximo 4 fotos
  uploadPhotos
);

export default router;
