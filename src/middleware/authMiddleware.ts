import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../entity/User";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = await User.findOne(decoded.id);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  next();
};
