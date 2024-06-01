import { Entity, PrimaryGeneratedColumn, ManyToOne, BaseEntity } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Like extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.likes)
  user: User;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.likes)
  post: Post;

  @Mutation(() => Boolean)
  async likePost(@Arg("postId") postId: number): Promise<boolean> {
    const post = await Post.findOne(postId);
    if (!post) throw new Error("Post not found");
    const like = Like.create({ user: this, post });
    await like.save();
    return true;
  }
}
