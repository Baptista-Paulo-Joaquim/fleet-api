import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: Function) => {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || user.type !== "STAFF") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const hasPermission = user.permissions.some(
      (p) => p.permission.type === permission
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ error: "You have no permission to perform this task!" });
    }

    next();
  };
};
