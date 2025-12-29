import { includes } from "zod";
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

  static delete(id: string) {
    return prisma.document.delete({ where: { id } });
  }
}
