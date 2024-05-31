import { Resolver } from "type-graphql";
import { Comment } from "../entity/Comment";
import { createCRUDResolvers } from "../utils/crudResolvers";

const BaseCommentResolver = createCRUDResolvers(Comment, "Comment");

@Resolver()
export class CommentResolver extends BaseCommentResolver {}
