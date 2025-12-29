import { Request, Response } from "express";
import { AuthService } from "../service/auth.service";

export const signup = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.signup(req.body);
    return res.status(201).json({ message: "User created", user });
  } catch (error: any) {
    if (error.message === "USER_EXISTS") {
      return res.status(400).json({ message: "User already exists" });
    }
    return res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { token } = await AuthService.login(email, password);

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    });

    return res.json({
      message: "Login successful",
    });
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.message === "INVALID_PASSWORD") {
      return res.status(401).json({ message: "Invalid password" });
    }
    return res.status(500).json({ message: "Login failed" });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("auth_token");
  return res.json({ message: "Logout successful" });
};
