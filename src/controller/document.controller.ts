import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { DocumentService } from "../service/document.service";
import { prisma } from "../lib/prisma";

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
