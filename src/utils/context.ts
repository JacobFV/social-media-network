import Resolver from "@/resolvers/Resolver";
import { DataClass } from "@/utils/dataclass";
import { PubSub } from "graphql-subscriptions"; // Import PubSub type
import { QueryRunner } from "typeorm";

@DataClass
export default class Context {
  currentAuthenticatedUser: any;
  queryRunner: QueryRunner;
  config: any;
  resolutionChain: Resolver[] = [];
  pubSub: PubSub;
  constructor(props?: Partial<Context>) {
    Object.assign(this, props);
  }
  get currentRecord() {
    return this.resolutionChain[this.resolutionChain.length - 1];
  }

  async withResolverScope(resolver: Resolver, action: () => Promise<any>) {
    this.resolutionChain.push(resolver);
    try {
      return await action();
    } finally {
      this.resolutionChain.pop();
    }
  }
}
