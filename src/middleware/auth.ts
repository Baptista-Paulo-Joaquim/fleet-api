import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserType } from "@prisma/client";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    type: UserType;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded: any = jwt.verify(token, process.env.SECRET!);
    req.user = { id: decoded.userId, type: decoded.type };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};
