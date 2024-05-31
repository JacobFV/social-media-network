import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import Express, { Request, Response, NextFunction, Application } from "express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/UserResolver";
import { PostResolver } from "./resolvers/PostResolver";
import { CommentResolver } from "./resolvers/CommentResolver";
import { CommentSubscriptionResolver } from "./resolvers/CommentSubscriptionResolver";
import { authMiddleware } from "./middleware/authMiddleware";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { PubSub } from "graphql-subscriptions";
import multer from "multer";
import { i18nMiddleware } from "./middleware/i18nMiddleware";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

(async () => {
  await createConnection();

  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      PostResolver,
      CommentResolver,
      CommentSubscriptionResolver,
    ],
    authChecker: ({ context: { user } }, roles) => {
      return !!user;
    },
  });

  const pubSub = new PubSub();

  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({
      currentAuthenticatedUser: req.user,
      dbSession: {}, // Add your DB session logic here
      config: {}, // Add your config logic here
      currentRecord: null, // Placeholder for the current record
      pubSub,
    }),
  });

  const app: Application = Express();
  app.use(authMiddleware as unknown as NextFunction);
  app.use(rateLimiterMiddleware as unknown as NextFunction);
  app.use(errorHandler as unknown as NextFunction);
  app.use(i18nMiddleware as unknown as NextFunction);

  const storage = multer.diskStorage({
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

  const upload = multer({ storage });

  app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
    res.json({ filename: req.file?.filename });
  });

  server.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000/graphql");
  });
})();
