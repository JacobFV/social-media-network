
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, BaseEntity } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Message extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  content: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.sentMessages)
  sender: User;

  @Field(() => User)
  @ManyToOne(() => User, user => user.receivedMessages)
  receiver: User;
}

@Mutation(() => Message)
async sendMessage(@Arg("receiverId") receiverId: number, @Arg("content") content: string): Promise<Message> {
  const receiver = await User.findOne(receiverId);
  if (!receiver) throw new Error("User not found");
  const message = Message.create({ content, sender: this, receiver });
  await message.save();
  return message;
}

@Subscription(() => Message, {
  topics: "NEW_MESSAGE",
  filter: ({ payload, args }) => payload.receiverId === args.receiverId,
})
onNewMessage(@Arg("receiverId") receiverId: number, @Root() message: Message): Message {
  return message;
}