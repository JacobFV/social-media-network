import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import { User } from "./User";
import { Comment } from "./Comment";
import { Like } from "./Like";
import Context from "@/utils/context";

@typeGQL.ObjectType()
@typeORM.Entity()
export class Post extends typeORM.BaseEntity {
  @typeGQL.Field(() => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field()
  @typeORM.Column()
  content: string;

  @typeGQL.Field(() => User)
  @typeORM.JoinColumn()
  @typeORM.ManyToOne(() => User, (user) => user.posts)
  author: User;

  @typeGQL.Field(() => [Comment])
  @typeORM.OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @typeGQL.Field(() => [Like])
  @typeORM.OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @typeGQL.Query(() => Boolean)
  async isVisibleToUser(
    @typeGQL.Arg("userId") userId: number
  ): Promise<boolean> {
    const user = await User.findOneBy({ id: userId });
    if (!user) throw new Error("User not found");
    if (
      this.author.id === userId ||
      user.following.some((followedUser) => followedUser.id === this.author.id)
    ) {
      return true;
    }
    return false;
  }

  @typeGQL.Mutation(() => Post)
  async createPost(@typeGQL.Arg("content") content: string): Promise<Post> {
    const post = Post.create({ content, author: this });
    await post.save();
    return post;
  }

  @typeGQL.Mutation(() => Boolean)
  async deletePost(@typeGQL.Arg("postId") postId: number): Promise<boolean> {
    const post = await Post.findOneBy({ id: postId });
    if (!post) throw new Error("Post not found");
    await post.remove();
    return true;
  }

  @typeGQL.Mutation(() => Post)
  async editPost(
    @typeGQL.Arg("postId") postId: number,
    @typeGQL.Arg("content") content: string
  ): Promise<Post> {
    const post = await Post.findOneBy({ id: postId });
    if (!post) throw new Error("Post not found");
    post.content = content;
    await post.save();
    return post;
  }
  @typeGQL.Mutation(() => Comment)
  async addComment(
    @typeGQL.Arg("content") content: string,
    @typeGQL.Ctx() ctx: Context
  ): Promise<Comment> {
    const author = ctx.currentAuthenticatedUser;
    if (!author) throw new Error("User not found");
    const comment = Comment.create({ content, author, post: this });
    await comment.save();
    return comment;
  }
}
