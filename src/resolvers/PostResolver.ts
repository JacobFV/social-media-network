import { Resolver } from "type-graphql";
import { Post } from "../entity/Post";
import { createCRUDResolvers } from "../utils/crudResolvers";

const BasePostResolver = createCRUDResolvers(Post, "Post");

@Resolver()
export class PostResolver extends BasePostResolver {}
