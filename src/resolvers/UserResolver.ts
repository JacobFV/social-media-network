import { Resolver } from "type-graphql";
import { User } from "../entity/User";
import { createCRUDResolvers } from "../utils/crudResolvers";

const BaseUserResolver = createCRUDResolvers(User, "User");

@Resolver()
export class UserResolver extends BaseUserResolver {}
