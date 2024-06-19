import { Resolver } from "type-graphql";
import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Ctx } from "type-graphql";
import Context from "@/utils/context";
import { UsePermissionsMiddleware } from "@/utils/permissions";
import { isAuthenticated } from "@/utils/permissions";
import { createCRUDResolver } from "@/utils/createCRUDResolver";
import { User } from "@/modules/user/entity";
import { Api, Server } from "@/utils/api-utils";

const BaseUserResolver = createCRUDResolver(User, "User");

const server = new Server()

@server.Router("/api/user")
@Resolver()
export class UserResolver extends BaseUserResolver {
  @()
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

  @Post
  @typeGQL.Mutation(() => User)
  async register(
    @typeGQL.Arg("username") username: string,
    @typeGQL.Arg("email") email: string,
    @typeGQL.Arg("password") password: string
  ): Promise<User> {
    const user = User.create({ username, email, hashedPassword: password });
    await user.save();
    return user;
  }

  @Post()
  @typeGQL.Mutation(() => Boolean)
  @UsePermissionsMiddleware(isAuthenticated())
  async requestToFollow(
    @typeGQL.Arg("targetUserId") targetUserId: number,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    const currentUser = ctx.currentScope;
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

  @Post()
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
