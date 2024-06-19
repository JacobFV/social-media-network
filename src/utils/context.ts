import { DataClass } from "@/utils/dataclass";
import { PubSub } from "graphql-subscriptions"; // Import PubSub type
import { QueryRunner } from "typeorm";
import express from "express";

@DataClass
export default class Context<Modes = "create" | "read" | "update" | "delete"> {
  req: express.Request;
  // mode: Modes;
  // currentAuthenticatedUser: any;
  // queryRunner: QueryRunner;
  pubSub: PubSub;
  scope: any[] = [];
  constructor(props?: Partial<Context>) {
    Object.assign(this, props);
  }
  get currentScope() {
    return this.scope[this.scope.length - 1];
  }

  async withScope(scope: any, action: () => Promise<any>) {
    this.scope.push(scope);
    try {
      return await action();
    } finally {
      this.scope.pop();
    }
  }
}
