import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BaseEntity,
} from "typeorm";
import { ObjectType, Field, ID, Arg, Mutation } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  content: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comments)
  author: User;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @Mutation(() => Comment)
  async addComment(
    @Arg("postId") postId: number,
    @Arg("content") content: string
  ): Promise<Comment> {
    const post = await Post.findOne(postId);
    if (!post) throw new Error("Post not found");
    const comment = Comment.create({ content, author: this, post });
    await comment.save();
    return comment;
  }

  @Mutation(() => Boolean)
  async deleteComment(@Arg("commentId") commentId: number): Promise<boolean> {
    const comment = await Comment.findOne(commentId);
    if (!comment) throw new Error("Comment not found");
    await comment.remove();
    return true;
  }
}
