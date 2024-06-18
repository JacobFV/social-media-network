import "reflect-metadata";
import Express, { Request, Response, NextFunction, Application } from "express";

import { upload } from "./storage";
import { authMiddleware } from "@/middleware/authMiddleware";
import { rateLimiterMiddleware } from "@/middleware/rateLimiter";
import { errorHandler } from "@/middleware/errorHandler";
import { i18nMiddleware } from "@/middleware/i18nMiddleware";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const app: Application = Express();
app.use(authMiddleware as unknown as NextFunction);
app.use(rateLimiterMiddleware as unknown as NextFunction);
app.use(errorHandler as unknown as NextFunction);
app.use(i18nMiddleware as unknown as NextFunction);

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  res.json({ filename: req.file?.filename });
});

server.applyMiddleware({ app, path: "/graphql" });
