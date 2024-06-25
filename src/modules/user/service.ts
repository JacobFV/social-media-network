import typeORM from "typeorm";
import typeGQL from "type-graphql";
import typeREST from "typescript-rest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Ctx } from "type-graphql";
import ServiceContext from "@/utils/context";
import { User } from "@/modules/user/entity";
import { Request } from "express";
import { Notification as AppNotification } from "@/modules/notification/entity";
import { createCRUDResolver } from "@/utils/crud-graphql-api/create-crud-graphql-resolver";

const BaseUserResolver = createCRUDResolver(User, {
  name: "User",
  create: (context: ServiceContext) => false,
  read: (context: ServiceContext) => true, // locked using the field level auth // TODO: implement in typeREST
  update: (context: ServiceContext) => true, // locked using the field level auth // TODO: implement in typeREST
  delete: (context: ServiceContext) => false,
});

@typeREST.Path("/api/user")
@typeGQL.Resolver()
export class UserService extends BaseUserResolver {
  async hashPassword(unhashed: string): Promise<string> {
    return await bcrypt.hash(unhashed, 10);
  }

  async validatePassword(password: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
  }

  async generateJWT(user: User): Promise<string> {
    return jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );
  }

  @typeREST.Path("/login")
  @typeREST.POST
  @typeGQL.Mutation(() => String, { description: "Login and return JWT token" })
  async login(
    @typeREST.PathParam("username") @typeGQL.Arg("username") username: string,
    @typeREST.PathParam("password") @typeGQL.Arg("password") password: string
  ): Promise<string> {
    const user = await User.findOneBy({ username });
    if (
      !user ||
      !(await this.validatePassword(password, user.hashedPassword))
    ) {
      throw new Error("Invalid credentials");
    }
    return this.generateJWT(user);
  }

  @typeREST.Path("/register")
  @typeREST.POST
  @typeGQL.Mutation(() => User)
  async register(
    @typeREST.PathParam("username") @typeGQL.Arg("username") username: string,
    @typeREST.PathParam("email") @typeGQL.Arg("email") email: string,
    @typeREST.PathParam("password") @typeGQL.Arg("password") password: string
  ): Promise<User> {
    const user = User.create({ username, email, hashedPassword: password });
    await user.save();
    return user;
  }

  @typeREST.Path("/request-to-follow")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  @UsePermissionsMiddleware(isAuthenticated())
  async requestToFollow(
    @typeREST.PathParam("targetUserId")
    @typeGQL.Arg("targetUserId")
    targetUserId: number,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<boolean> {
    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    const targetUser = await User.findOneBy({ id: targetUserId });
    if (!targetUser) throw new Error("User not found");
    if (targetUser.isPrivate) {
      targetUser.followRequests.push(user);
      await targetUser.save();
      const notification = AppNotification.create({
        content: `${user.username} wants to follow you`,
        user: targetUser,
      });
      await notification.save();
    } else {
      user.following.push(targetUser);
      await user.save();
    }
    return true;
  }

  @typeREST.Path("/accept-follow-request")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async acceptFollowRequest(
    @typeREST.PathParam("requesterUserId")
    @typeGQL.Arg("requesterUserId")
    requesterUserId: number,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<boolean> {
    const requesterUser = await User.findOneBy({ id: requesterUserId });
    if (!requesterUser) throw new Error("User not found");
    if (!(requesterUser instanceof User)) throw new Error("User not found");

    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    user.followRequests = user.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    user.followers.push(requesterUser);
    requesterUser.following.push(user);
    await user.save();
    await requesterUser.save();
    return true;
  }

  @typeREST.Path("/decline-follow-request")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async declineFollowRequest(
    @typeREST.PathParam("requesterUserId")
    @typeGQL.Arg("requesterUserId")
    requesterUserId: number,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<boolean> {
    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    user.followRequests = user.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    await user.save();
    return true;
  }

  @typeREST.Path("/follow")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async follow(
    @typeREST.PathParam("targetUserId")
    @typeGQL.Arg("targetUserId")
    targetUserId: number,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<boolean> {
    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    const targetUser = await User.findOneBy({ id: targetUserId });
    if (!targetUser) throw new Error("User not found");
    if (!targetUser.isPrivate) {
      user.following.push(targetUser);
      await user.save();
    } else {
      throw new Error("User is private");
    }
    return true;
  }

  @typeREST.Path("/unfollow")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async unfollow(
    @typeREST.PathParam("targetUserId")
    @typeGQL.Arg("targetUserId")
    targetUserId: number,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<boolean> {
    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    user.following = user.following.filter((user) => user.id !== targetUserId);
    await user.save();
    return true;
  }

  @typeREST.Path("/update-profile")
  @typeREST.POST
  @typeGQL.Mutation(() => User)
  async updatePassword(
    @typeREST.PathParam("currentPassword")
    @typeGQL.Arg("currentPassword")
    currentPassword: string,
    @typeREST.PathParam("newPassword")
    @typeGQL.Arg("newPassword")
    newPassword: string,
    @typeREST.ContextRequest @typeGQL.Ctx() ctx: Request
  ): Promise<User> {
    const user = ctx.user;
    if (!user) throw new Error("User not found");
    if (!(user instanceof User)) throw new Error("User not found");

    if (!(await this.validatePassword(currentPassword, user.hashedPassword))) {
      throw new Error("Invalid credentials");
    }

    user.hashedPassword = await this.hashPassword(newPassword);
    await user.save();
    return user;
  }
}
