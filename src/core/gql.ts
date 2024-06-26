import { ApolloServer } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
import { buildSchema, MiddlewareFn, NonEmptyArray } from "type-graphql";
import { config } from "@/core/config";
import { singleton } from "@/utils/singleton-async-runner";
import { appDataSource } from "./db/appDataSource";
import { GraphQLSchema } from "graphql/type/schema";
import ServiceContext from "@/utils/context";

const resolvers: Function[] = [];
let apolloServerInstance: ApolloServer | null = null;
let schemaInstance: any = null;

export const buildGraphQLSchema: () => Promise<GraphQLSchema> = singleton(
  async () => {
    if (schemaInstance) {
      console.debug("GraphQL schema already built!");
      return schemaInstance;
    }
    console.debug("Building GraphQL schema...");
    if (resolvers.length === 0) {
      throw new Error("No resolvers registered!");
    }
    schemaInstance = await buildSchema({
      resolvers: resolvers as NonEmptyArray<Function>,
      authChecker: ({ context: { user } }, roles) => !!user,
      globalMiddlewares: [],
    });
    console.debug("GraphQL schema has been built!");
    return schemaInstance;
  }
);

export const getOrInitApolloServer: () => Promise<ApolloServer> = singleton(
  async () => {
    if (apolloServerInstance) {
      console.debug("ApolloServer already initialized!");
      return apolloServerInstance;
    }
    console.debug("Initializing ApolloServer...");

    const schema = await buildGraphQLSchema();
    const pubSub = new PubSub();
    // const queryRunner = appDataSource.createQueryRunner();

    apolloServerInstance = new ApolloServer({
      schema,
      context: ({ req }) =>
        new ServiceContext({
          req,
          // currentAuthenticatedUser: req.user,
          // queryRunner,
          graphqlPubSub: pubSub,
        }),
    });

    console.debug("ApolloServer has been initialized!");
    return apolloServerInstance;
  }
);
