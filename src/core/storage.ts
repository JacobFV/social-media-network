import "reflect-metadata";
import Express, { Request, Response, NextFunction, Application } from "express";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { i18nMiddleware } from "./middleware/i18nMiddleware";

import multer from "multer";

export const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, "uploads/");
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
