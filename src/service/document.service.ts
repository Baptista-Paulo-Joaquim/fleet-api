import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

export class DocumentService {
  static getAll() {
    return prisma.document.findMany({ include: { photos: true } });
  }

  static create(data: any, userId: string) {
    return prisma.document.create({
      data: {
        ...data,
        expirationDate: new Date(data.expirationDate),
        registeredById: userId,
      },
    });
  }

  static update(id: string, data: any) {
    if (data.expirationDate) {
      data.expirationDate = new Date(data.expirationDate);
    }

    return prisma.document.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const photos = await prisma.documentPhoto.findMany({
      where: { documentId: id },
    });

    for (const photo of photos) {
      const filePath = path.join(
        process.cwd(),
        "uploads",
        path.basename(photo.url)
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return prisma.document.delete({
      where: { id },
    });
  }
}
