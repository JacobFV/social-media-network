import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Post } from "./Post";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { Notification } from "./Notification";
import { Message } from "./Message";
import {
  CustomBaseEntity,
  EntityWithID,
  EntityWithOwner,
} from "@/entity/CustomBaseEntity";
import { Ctx } from "type-graphql";
import Context from "@/utils/context";
import { UsePermissionsMiddleware } from "@/utils/permissions";
import { isAuthenticated } from "@/utils/permissions";

@typeGQL.ObjectType()
@typeORM.Entity()
export class User
  extends CustomBaseEntity<User>
  implements EntityWithID<User>, EntityWithOwner<User>
{
  @typeGQL.Field((type) => typeGQL.ID)
  @typeORM.PrimaryGeneratedColumn()
  id: number;

  @typeGQL.Field((type) => typeGQL.ID)
  @typeORM.Column()
  ownerId: number;

  @typeGQL.Field()
  @typeORM.Column({ unique: true })
  username: string;

  @typeGQL.Field({ description: "primary email" })
  @typeORM.Column()
  email: string;

  @typeGQL.Field()
  @typeORM.Column()
  password: string;

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
  @typeORM.OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

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

  @typeORM.BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  generateJWT(): string {
    return jwt.sign(
      { id: this.id, username: this.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
  }

  @typeGQL.Mutation(() => String, { description: "Login and return JWT token" })
  async login(
    @typeGQL.Arg("username") username: string,
    @typeGQL.Arg("password") password: string
  ): Promise<string> {
    const user = await User.findOneBy({ username });
    if (!user || !(await user.validatePassword(password))) {
      throw new Error("Invalid credentials");
    }
    return user.generateJWT();
  }

  @typeGQL.Mutation(() => User)
  async register(
    @typeGQL.Arg("username") username: string,
    @typeGQL.Arg("email") email: string,
    @typeGQL.Arg("password") password: string
  ): Promise<User> {
    const user = User.create({ username, email, password });
    await user.save();
    return user;
  }

  @typeGQL.Mutation(() => Boolean)
  @UsePermissionsMiddleware(isAuthenticated())
  async requestToFollow(
    @typeGQL.Arg("targetUserId") targetUserId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const currentUser = ctx.currentRecord;
    if (!currentUser) throw new Error("User not found");
    if (!(currentUser instanceof User)) throw new Error("User not found");

    const targetUser = await User.findOneBy({ id: targetUserId });
    if (!targetUser) throw new Error("User not found");
    if (targetUser.isPrivate) {
      targetUser.followRequests.push(currentUser);
      await targetUser.save();
      const notification = Notification.create({
        content: `${this.username} wants to follow you`,
        user: targetUser,
      });
      await notification.save();
    } else {
      currentUser.following.push(targetUser);
      await currentUser.save();
    }
    return true;
  }

  @typeGQL.Mutation(() => Boolean)
  async acceptFollowRequest(
    @typeGQL.Arg("requesterUserId") requesterUserId: number
  ): Promise<boolean> {
    const requesterUser = await User.findOneBy({ id: requesterUserId });
    if (!requesterUser) throw new Error("User not found");
    this.followRequests = this.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    this.followers.push(requesterUser);
    requesterUser.following.push(this);
    await this.save();
    await requesterUser.save();
    return true;
  }

  @typeGQL.Mutation(() => Boolean)
  async declineFollowRequest(
    @typeGQL.Arg("requesterUserId") requesterUserId: number
  ): Promise<boolean> {
    this.followRequests = this.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    await this.save();
    return true;
  }

  @typeGQL.Mutation(() => Boolean)
  async follow(
    @typeGQL.Arg("targetUserId") targetUserId: number
  ): Promise<boolean> {
    const targetUser = await User.findOneBy({ id: targetUserId });
    if (!targetUser) throw new Error("User not found");
    if (!targetUser.isPrivate) {
      this.following.push(targetUser);
      await this.save();
    } else {
      throw new Error("User is private");
    }
    return true;
  }

  @typeGQL.Mutation(() => Boolean)
  async unfollow(
    @typeGQL.Arg("targetUserId") targetUserId: number
  ): Promise<boolean> {
    this.following = this.following.filter((user) => user.id !== targetUserId);
    await this.save();
    return true;
  }

  @typeGQL.Mutation(() => User)
  async updateProfile(
    @typeGQL.Arg("username") username: string,
    @typeGQL.Arg("email") email: string
  ): Promise<User> {
    this.username = username;
    this.email = email;
    await this.save();
    return this;
  }
}
