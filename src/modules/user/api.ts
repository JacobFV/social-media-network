import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notification } from "../notification/entity";
import { Ctx } from "type-graphql";
import Context from "@/utils/context";
import { UsePermissionsMiddleware } from "@/utils/permissions";
import { isAuthenticated } from "@/utils/permissions";
import { User } from "@/modules/user/entity";

// TODO: need to put this all in the resolver

async function hashPassword(unhashed: string): Promise<string> {
    return await bcrypt.hash(unhashed, 10);
}

async function validatePassword(
    password: string,
    hashed: string
): Promise<boolean> {
    return await bcrypt.compare(password, hashed);
}

async function generateJWT(user: User): Promise<string> {
    return jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
    );
}

async function login(username: string, password: string): Promise<string> {
    const user = await User.findOneBy({ username });
    if (
        !user ||
        !(await validatePassword(password, user.hashedPassword))
    ) {
        throw new Error("Invalid credentials");
    }
    return generateJWT(user);
}

async function register(
    username: string,
    email: string,
    password: string
): Promise<User> {
    const hashedPassword = await hashPassword(password);
    const user = User.create({ username, email, hashedPassword });
    await user.save();
    return user;
}

@UsePermissionsMiddleware(isAuthenticated())
async function requestToFollow(currentUser: User, targetUserId: number): Promise<boolean> {
    if (!currentUser) throw new Error("User not found");

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

async function acceptFollowRequest(currentUser: User, requesterUserId: number): Promise<boolean> {
    if (!currentUser) throw new Error("User not found");

    const requesterUser = await User.findOneBy({ id: requesterUserId });
    if (!requesterUser) throw new Error("User not found");
    currentUser.followRequests = currentUser.followRequests.filter(
        (user) => user.id !== requesterUserId
    );
    currentUser.followers.push(requesterUser);
    requesterUser.following.push(currentUser);
    await currentUser.save();
    await requesterUser.save();
    return true;
}

async function declineFollowRequest(currentUser: User, requesterUserId: number): Promise<boolean> {
    if (!currentUser) throw new Error("User not found");

    currentUser.followRequests = currentUser.followRequests.filter(
        (user) => user.id !== requesterUserId
    );
    await currentUser.save();
    return true;
}

async function follow(currentUser: User, targetUserId: number): Promise<boolean> {
    if (!currentUser) throw new Error("User not found");

    const targetUser = await User.findOneBy({ id: targetUserId });
    if (!targetUser) throw new Error("User not found");
    if (!targetUser.isPrivate) {
        currentUser.following.push(targetUser);
        await currentUser.save();
    } else {
        throw new Error("User is private");
    }
    return true;
}

async function unfollow(currentUser: User, targetUserId: number): Promise<boolean> {
    if (!currentUser) throw new Error("User not found");

    currentUser.following = currentUser.following.filter((user) => user.id !== targetUserId);
    await currentUser.save();
    return true;
}

async function updateProfile(currentUser: User, username: string, email: string): Promise<User> {
    if (!currentUser) throw new Error("User not found");

    currentUser.username = username;
    currentUser.email = email;
    await currentUser.save();
    return currentUser;
}