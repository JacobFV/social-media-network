import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  BaseEntity,
  BeforeInsert,
} from "drizzle-orm";
import {
  ObjectType,
  Field,
  ID,
  Arg,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Post } from "./Post";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { Notification } from "./Notification";
import { Message } from "./Message";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Field()
  @Column({ default: false })
  isPrivate: boolean;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.following)
  @JoinTable()
  followers: User[];

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.followers)
  following: User[];

  @Field(() => [Post])
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable()
  followRequests: User[];

  @Field(() => [Notification])
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @Field(() => [Message])
  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @BeforeInsert()
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

  @Mutation(() => String)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string
  ): Promise<string> {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.validatePassword(password))) {
      throw new Error("Invalid credentials");
    }
    return user.generateJWT();
  }

  @Mutation(() => User)
  async register(
    @Arg("username") username: string,
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<User> {
    const user = User.create({ username, email, password });
    await user.save();
    return user;
  }

  @Mutation(() => Boolean)
  async requestToFollow(
    @Arg("targetUserId") targetUserId: number
  ): Promise<boolean> {
    const targetUser = await User.findOne(targetUserId);
    if (!targetUser) throw new Error("User not found");
    if (targetUser.isPrivate) {
      targetUser.followRequests.push(this);
      await targetUser.save();
      const notification = Notification.create({
        content: `${this.username} wants to follow you`,
        user: targetUser,
      });
      await notification.save();
    } else {
      this.following.push(targetUser);
      await this.save();
    }
    return true;
  }

  @Mutation(() => Boolean)
  async acceptFollowRequest(
    @Arg("requesterUserId") requesterUserId: number
  ): Promise<boolean> {
    const requesterUser = await User.findOne(requesterUserId);
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

  @Mutation(() => Boolean)
  async declineFollowRequest(
    @Arg("requesterUserId") requesterUserId: number
  ): Promise<boolean> {
    this.followRequests = this.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    await this.save();
    return true;
  }

  @Mutation(() => Boolean)
  async follow(@Arg("targetUserId") targetUserId: number): Promise<boolean> {
    const targetUser = await User.findOne(targetUserId);
    if (!targetUser) throw new Error("User not found");
    if (!targetUser.isPrivate) {
      this.following.push(targetUser);
      await this.save();
    } else {
      throw new Error("User is private");
    }
    return true;
  }

  @Mutation(() => Boolean)
  async unfollow(@Arg("targetUserId") targetUserId: number): Promise<boolean> {
    this.following = this.following.filter((user) => user.id !== targetUserId);
    await this.save();
    return true;
  }

  @Mutation(() => User)
  async updateProfile(
    @Arg("username") username: string,
    @Arg("email") email: string
  ): Promise<User> {
    this.username = username;
    this.email = email;
    await this.save();
    return this;
  }
}
