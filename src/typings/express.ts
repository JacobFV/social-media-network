import { DataClass } from "@/utils/dataclass";
import { PubSub } from "graphql-subscriptions"; // Import PubSub type
import { QueryRunner } from "typeorm";
import express from "express";
import { User } from "@/modules/user/entity";

// declare module "express" {
//   interface Request {
//     user: User | undefined;
//     pubSub?: PubSub; // only used in graphql
//   }
// }
