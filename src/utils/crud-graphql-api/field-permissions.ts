import ServiceContext from "@/utils/context";
import { MiddlewareFn } from "type-graphql";
import { UseMiddleware, Extensions, createMethodDecorator } from "type-graphql";

// Type for the permission validator function
export type PermissionValidator = (context: ServiceContext, entity?: any) => Promise<boolean>;

// Permissions middleware factory function
export function permissions(validator: PermissionValidator): MiddlewareFn<ServiceContext> {
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

export function isAuthenticated(): (context: ServiceContext, entity?: any) => Promise<boolean> {
  return async (context: ServiceContext, entity?: any): Promise<boolean> => {
    return !!context.user;
  };
}

export function isAdmin(): (context: ServiceContext, entity?: any) => Promise<boolean> {
  return async (context: ServiceContext, entity?: any): Promise<boolean> => {
    return context.user.role === "admin";
  };
}

export function isAuthorizedWithRole(
  role: string
): (context: ServiceContext, entity?: any) => Promise<boolean> {
  return async (context: ServiceContext, entity?: any): Promise<boolean> => {
    return context.user.role === role;
  };
}

export function isOwner(): (context: ServiceContext, entity?: any) => Promise<boolean> {
  return async (context: ServiceContext, entity?: any): Promise<boolean> => {
      return (
        const currentRecord = context.currentScope;
        if (!currentRecord) {
        return false
        }
        if (!(currentRecord instanceof OwnedRecord)) {
        return false
        }
        context.user.id === currentRecord.ownerId
    );
  };
}

export function publicAccess(): (context: ServiceContext) => Promise<boolean> {
  return async (context: ServiceContext): Promise<boolean> => {
    return true;
  };
}

export function privateAccess(): (context: ServiceContext) => Promise<boolean> {
  return async (context: ServiceContext): Promise<boolean> => {
    return false;
  };
}
