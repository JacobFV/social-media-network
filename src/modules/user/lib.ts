import * as typeORM from "typeorm";
import * as typeGQL from "type-graphql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Notification } from "../notification/entity";
import { Ctx } from "type-graphql";
import ServiceContext from "@/utils/context";
import { UsePermissionsMiddleware } from "@/utils/permissions";
import { isAuthenticated } from "@/utils/permissions";
import { User } from "@/modules/user/entity";

// TODO: need to put this all in the resolver
