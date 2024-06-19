import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import { User } from "../user/entity";
import { Post } from "../post/entity";

@typeGQL.ObjectType()
@typeORM.Entity()
export class Like extends typeORM.BaseEntity {
  @typeGQL.Field(() => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field(() => User)
  @typeORM.ManyToOne(() => User, (user) => user.likes)
  user: User;

  @typeGQL.Field(() => Post)
  @typeORM.ManyToOne(() => Post, (post) => post.likes)
  post: Post;

  @typeGQL.Mutation(() => Boolean)
  async likePost(@typeGQL.Arg("postId") postId: number): Promise<boolean> {
    const post = await Post.findOne({ where: { id: postId } });
    if (!post) throw new Error("Post not found");
    const like = Like.create({ user: this, post });
    await like.save();
    return true;
  }
}
