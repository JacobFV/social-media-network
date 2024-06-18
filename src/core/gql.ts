import { ApolloServer } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";

import { buildSchema } from "type-graphql";
import { UserResolver } from "@/resolvers/UserResolver";
import { PostResolver } from "@/resolvers/PostResolver";
import { CommentResolver } from "@/resolvers/CommentResolver";
import { CommentSubscriptionResolver } from "./resolvers/CommentSubscriptionResolver";

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
