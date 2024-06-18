import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { ObjectType, Field, ID, Arg, Mutation, Query } from "type-graphql";
import { User } from "./User";
import { Comment } from "./Comment";
import { Like } from "./Like";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  content: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @Field(() => [Comment])
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @Field(() => [Like])
  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Query(() => Boolean)
  async isVisibleToUser(@Arg("userId") userId: number): Promise<boolean> {
    const user = await User.findOne(userId, { relations: ["following"] });
    if (!user) throw new Error("User not found");
    if (
      this.author.id === userId ||
      user.following.some((followedUser) => followedUser.id === this.author.id)
    ) {
      return true;
    }
    return false;
  }

  @Mutation(() => Post)
  async createPost(@Arg("content") content: string): Promise<Post> {
    const post = Post.create({ content, author: this });
    await post.save();
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("postId") postId: number): Promise<boolean> {
    const post = await Post.findOne(postId);
    if (!post) throw new Error("Post not found");
    await post.remove();
    return true;
  }

  @Mutation(() => Post)
  async editPost(
    @Arg("postId") postId: number,
    @Arg("content") content: string
  ): Promise<Post> {
    const post = await Post.findOne(postId);
    if (!post) throw new Error("Post not found");
    post.content = content;
    await post.save();
    return post;
  }
}
