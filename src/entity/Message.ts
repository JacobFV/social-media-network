import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import { User } from "./User";

@typeGQL.ObjectType()
@typeORM.Entity()
export class Message extends typeORM.BaseEntity {
  @typeGQL.Field(() => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field()
  @typeORM.Column()
  content: string;

  @typeGQL.Field(() => User)
  @typeORM.ManyToOne(() => User, (user) => user.sentMessages)
  sender: User;

  @typeGQL.Field(() => User)
  @typeORM.ManyToOne(() => User, (user) => user.receivedMessages)
  receiver: User;

  @typeGQL.Mutation(() => Message)
  @typeGQL.Authorized("isOwner")
  async sendMessage(
    @typeGQL.Arg("receiverId") receiverId: number,
    @typeGQL.Arg("content") content: string
  ): Promise<Message> {
    const receiver = await User.findOne({ where: { id: receiverId } });
    if (!receiver) throw new Error("User not found");
    const message = Message.create({ content, sender: this, receiver });
    await message.save();
    return message;
  }

  @typeGQL.Subscription(() => Message, {
    topics: "NEW_MESSAGE",
    filter: ({ payload, args }) => payload.receiverId === args.receiverId,
  })
  onNewMessage(
    @typeGQL.Arg("receiverId") receiverId: number,
    @typeGQL.Root() message: Message
  ): Message {
    return message;
  }
}
