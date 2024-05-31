import { PubSubEngine } from "graphql-subscriptions";
import { PubSub, Subscription, Arg, Root } from "type-graphql";
import { Comment } from "../entity/Comment";

const COMMENT_ADDED = "COMMENT_ADDED";

@Resolver()
export class CommentSubscriptionResolver {
  @Subscription(() => Comment, {
    topics: COMMENT_ADDED,
    filter: ({ payload, args }) => payload.postId === args.postId,
  })
  onCommentAdded(
    @Arg("postId") postId: number,
    @Root() comment: Comment
  ): Comment {
    return comment;
  }

  @Mutation(() => Comment)
  async addComment(
    @Arg("postId") postId: number,
    @Arg("content") content: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<Comment> {
    const comment = await Comment.addComment(postId, content);
    await pubSub.publish(COMMENT_ADDED, { comment, postId });
    return comment;
  }
}
