import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Post } from "../post/entity";
import { Comment } from "../comment/entity";
import { Like } from "../like/entity";
import { Notification } from "../notification/entity";
import { Message } from "../message/entity";
import {
  CommonBaseEntity,
  EntityWithID,
  EntityWithOwner,
} from "@/modules/base/entity";
import { Ctx } from "type-graphql";
import ServiceContext from "@/utils/context";

@typeGQL.ObjectType()
@typeORM.Entity()
export class User
  extends CommonBaseEntity
  implements EntityWithID, EntityWithOwner
{
  @typeGQL.Field((type) => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field((type) => typeGQL.ID)
  get ownerId(): number {
    return this.id;
  }

  @typeGQL.Field()
  @typeORM.Column({ unique: true })
  username: string;

  @typeGQL.Field({ description: "primary email" })
  @typeORM.Column()
  email: string;

  @typeORM.Column()
  hashedPassword: string;

  @typeGQL.Field()
  @typeORM.Column({ default: false })
  isPrivate: boolean;

  @typeGQL.Field()
  @typeORM.ManyToMany(() => User, (user) => user.following)
  @typeORM.JoinTable()
  followers: User[];

  @typeGQL.Field()
  @typeORM.ManyToMany(() => User, (user) => user.followers)
  following: User[];

  @typeGQL.Field()
  @typeORM.OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @typeGQL.Field()
  get comments(): Comment[] {
    return this.posts.flatMap((post) => post.comments);
  }

  @typeGQL.Field()
  @typeORM.ManyToMany(() => User)
  @typeORM.JoinTable()
  followRequests: User[];

  @typeGQL.Field()
  @typeORM.OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @typeGQL.Field()
  @typeORM.OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @typeGQL.Field()
  @typeORM.OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];
}
