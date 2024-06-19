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
import * as typeREST from "typescript-rest";

const BaseUserResolver = createCRUDResolver(User, {
  name: "User",
  create: false,
  read: true, // locked using the field level auth // TODO: implement in typeREST
  update: true, // locked using the field level auth // TODO: implement in typeREST
  delete: false,
});

@typeREST.Path("/api/user")
@Resolver()
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
        content: `${currentUser.username} wants to follow you`,
        user: targetUser,
      });
      await notification.save();
    } else {
      currentUser.following.push(targetUser);
      await currentUser.save();
    }
    return true;
  }

  @typeREST.Path("/accept-follow-request")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async acceptFollowRequest(
    @typeREST.PathParam("requesterUserId")
    @typeGQL.Arg("requesterUserId")
    requesterUserId: number
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

  @typeREST.Path("/decline-follow-request")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async declineFollowRequest(
    @typeREST.PathParam("requesterUserId")
    @typeGQL.Arg("requesterUserId")
    requesterUserId: number
  ): Promise<boolean> {
    this.followRequests = this.followRequests.filter(
      (user) => user.id !== requesterUserId
    );
    await this.save();
    return true;
  }

  @typeREST.Path("/follow")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async follow(
    @typeREST.PathParam("targetUserId")
    @typeGQL.Arg("targetUserId")
    targetUserId: number
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

  @typeREST.Path("/unfollow")
  @typeREST.POST
  @typeGQL.Mutation(() => Boolean)
  async unfollow(
    @typeREST.PathParam("targetUserId")
    @typeGQL.Arg("targetUserId")
    targetUserId: number
  ): Promise<boolean> {
    this.following = this.following.filter((user) => user.id !== targetUserId);
    await this.save();
    return true;
  }

  @typeREST.Path("/update-profile")
  @typeREST.POST
  @typeGQL.Mutation(() => User)
  async updateProfile(
    @typeREST.PathParam("username") @typeGQL.Arg("username") username: string,
    @typeREST.PathParam("email") @typeGQL.Arg("email") email: string
  ): Promise<User> {
    this.username = username;
    this.email = email;
    await this.save();
    return this;
  }
}
