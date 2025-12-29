import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "informa-secret";

export class AuthService {
  static async signup(data: {
    name: string;
    email: string;
    password: string;
    role?: "ADMIN" | "USER";
  }) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new Error("USER_EXISTS");
    }

    const hashed = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role,
      },
    });
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("INVALID_PASSWORD");
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { token };
  }
}
