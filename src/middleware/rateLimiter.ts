import { RateLimiterMemory } from "rate-limiter-flexible";
import { Request, Response, NextFunction } from "express";

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
});

export const rateLimiterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send("Too Many Requests");
    });
};
