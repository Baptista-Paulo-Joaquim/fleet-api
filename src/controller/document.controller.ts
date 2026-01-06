import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DocumentService } from "../service/document.service";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

export const getDocument = async (_req: AuthRequest, res: Response) => {
  try {
    const documents = await DocumentService.getAll();
    return res.json(documents);
  } catch {
    return res.status(500).json({ message: "Error retrieving documents" });
  }
};

export const createDocument = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await DocumentService.create(req.body, req.user!.userId);
    return res.status(201).json(doc);
  } catch {
    return res.status(500).json({ message: "Error creating document" });
  }
};

export const updateDocument = async (req: AuthRequest, res: Response) => {
  try {
    const updated = await DocumentService.update(req.params.id, req.body);
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Error updating document" });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    await DocumentService.delete(req.params.id);
    return res.json({ message: "Document deleted successfully" });
  } catch {
    return res.status(500).json({ message: "Error deleting document" });
  }
};

export const uploadPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const photos = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        const photo = await prisma.documentPhoto.create({
          data: {
            documentId: id,
            url: `/uploads/${file.filename}`,
          },
        });
        return photo;
      })
    );

    return res.status(201).json({ message: "Photos uploaded", photos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to upload photos" });
  }
};

export const deleteDocumentPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { photoId } = req.params;
    const userId = req.user!.userId;

    const photo = await prisma.documentPhoto.findUnique({
      where: { id: photoId },
      include: {
        document: true,
      },
    });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    if (photo.document.registeredById !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      path.basename(photo.url)
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.documentPhoto.delete({
      where: { id: photoId },
    });

    return res.json({ message: "Photo deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete photo" });
  }
};
