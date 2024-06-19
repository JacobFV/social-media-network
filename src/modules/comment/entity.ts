import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import { User } from "../user/entity";
import { Post } from "../post/entity";
import Context from "@/utils/context";

@typeGQL.ObjectType()
@typeORM.Entity()
export class Comment extends Post {
  @typeGQL.Field(() => Post)
  @typeORM.JoinColumn()
  @typeORM.ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @typeGQL.Mutation(() => Boolean)
  async deleteComment(
    @typeGQL.Arg("commentId") commentId: number,
    @typeGQL.Ctx() ctx: Context
  ): Promise<boolean> {
    const comment = await Comment.findOne({ where: { id: commentId } });
    if (!comment) throw new Error("Comment not found");
    await comment.remove();
    return true;
  }
}
