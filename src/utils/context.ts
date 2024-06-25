import { DataClass } from "@/utils/dataclass";
import { PubSub } from "graphql-subscriptions"; // Import PubSub type
import { QueryRunner } from "typeorm";
import express from "express";
import { ExpressContext as ApolloExpressContext } from "apollo-server-express";

export abstract class Context {}

@DataClass
export class ScopedContext extends Context {
  scopeStack: any[] = [];

  async withScope<T>(
    overrides: { [key: string]: any },
    action: (scope: ScopedContext) => Promise<T>
  ): Promise<T> {
    const current = this;
    const newScope = { ...current, ...overrides };
    this.scopeStack.push(newScope);
    try {
      return await action(newScope);
    } finally {
      this.scopeStack.pop();
    }
  }
}

export interface ExpressContext extends ApolloExpressContext {
  req: express.Request;
  res: express.Response;
}

@DataClass
export default class ServiceContext
  extends ScopedContext
  implements ExpressContext
{
  req: express.Request;
  res: express.Response;
  user?: any;
  graphqlPubSub?: PubSub;
  selectedEntityFromAuthMiddleware?: BaseEntity;
}
