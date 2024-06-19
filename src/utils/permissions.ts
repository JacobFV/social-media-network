import Context from "@/utils/context";
import { MiddlewareFn } from "type-graphql";
import { UseMiddleware, Extensions, createMethodDecorator } from "type-graphql";

// Type for the permission validator function
type PermissionValidator = (context: Context) => Promise<boolean>;

// Permissions middleware factory function
export function permissions(validator: PermissionValidator): MiddlewareFn<Context> {
  return async ({ context, args }, next) => {
    if (!(await validator(context))) {
      throw new Error("Access denied! You do not have permission to perform this action.");
    }
    return next();
  };
}

// Custom decorator to apply permissions middleware and add extensions
// Optionally accepts roles, otherwise uses the validator function name
export function UsePermissionsMiddleware(validator: PermissionValidator, roles?: string[]) {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    UseMiddleware(permissions(validator))(target, key, descriptor);
    // Use provided roles or default to the validator function name
    const rolesToUse = roles || [validator.name];
    Extensions({ roles: rolesToUse })(target, key, descriptor);
  };
}

export function isAuthenticated(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return !!context.currentAuthenticatedUser;
  };
}

export function isAdmin(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return context.currentAuthenticatedUser.role === "admin";
  };
}

export function isAuthorizedWithRole(
  role: string
): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return context.currentAuthenticatedUser.role === role;
  };
}

export function isOwner(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
      return (
        const currentRecord = context.currentScope;
        if (!currentRecord) {
        return false
        }
        if (!(currentRecord instanceof OwnedRecord)) {
        return false
        }
        context.currentAuthenticatedUser.id === currentRecord.ownerId
    );
  };
}

export function publicAccess(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return true;
  };
}

export function privateAccess(): (context: Context) => Promise<boolean> {
  return async (context: Context): Promise<boolean> => {
    return false;
  };
}
