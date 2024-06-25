import { PermissionValidator } from "@/utils/crud-graphql-api/field-permissions";
import { ClassType, MiddlewareFn } from "type-graphql";
import graphqlFields from "graphql-fields";
import { asyncNothing } from "@/utils/crud-graphql-api/misc";
import {
  BaseEntity,
  FindOptionsWhere,
  getRepository,
  Repository,
} from "typeorm";
import ServiceContext from "@/utils/context";
import { getRepositoryForType } from "@/core/db/registry";
import { EntityWithID } from "@/modules/base/entity";
import { Constructor } from "@/utils/types";
import {
  HttpError,
  NotFoundError,
  UnauthorizedError,
} from "typescript-rest/dist/server/model/errors";

export const ENTITY_CRUD_PERMISSIONS_KEY = "custom:crud-permissions";

export interface CRUDPermissionOptions {
  name?: string;
  enableCreate: boolean;
  enableRead: boolean;
  enableUpdate: boolean;
  enableDelete: boolean;
  createPermissionValidator: PermissionValidator;
  readPermissionValidator: PermissionValidator;
  updatePermissionValidator: PermissionValidator;
  deletePermissionValidator: PermissionValidator;
  errorStrategy: "throw" | "null" | "ignore";
}

export const DEFAULT_CRUD_PERMISSIONS_OPTIONS: CRUDPermissionOptions = {
  enableCreate: true,
  enableRead: true,
  enableUpdate: true,
  enableDelete: true,
  createPermissionValidator: async (context, entity?) => true,
  readPermissionValidator: async (context, entity?) => true,
  updatePermissionValidator: async (context, entity?) => true,
  deletePermissionValidator: async (context, entity?) => true,
  errorStrategy: "throw",
};

/**
 * Decorator to apply CRUD permissions to an entity.
 * @param options The options to apply to the entity.
 * @returns A decorator to apply to the entity.
 *
 * @example
 * ```ts
 * @Entity()
 * @CRUDPermissions({
 *   createPermissionValidator: async (context, entity) => entity.userId === context.user.id,
 * })
 * class MyEntity {
 *   @Field()
 *   id: string;
 *
 *   // ...
 * }
 * ```
 */
export function CRUDPermissions(
  options: Partial<CRUDPermissionOptions> = DEFAULT_CRUD_PERMISSIONS_OPTIONS
) {
  return function (target: any, propertyKey?: string | symbol) {
    if (propertyKey !== undefined) {
      throw new Error(
        "CRUDPermissions must be applied on classes, not on fields or methods"
      );
    }
    const entityPermissionsOptions = {
      ...DEFAULT_CRUD_PERMISSIONS_OPTIONS,
      ...options,
    };
    Reflect.defineMetadata(
      ENTITY_CRUD_PERMISSIONS_KEY,
      entityPermissionsOptions,
      target
    );
  };
}

type MiddlewareOptions = {
  obscureErrors: boolean;
};
const DEFAULT_MIDDLEWARE_OPTIONS: MiddlewareOptions = {
  obscureErrors: false,
};

export function CreatePermissionsMiddleware<T extends BaseEntity>(
  entityClass: ClassType<T>,
  methodName: string,
  indexName: string = "id"
): MiddlewareFn<ServiceContext> {
  return async ({ context, args, info }, next) => {
    // Retrieve permissions from metadata
    const permissions: CRUDPermissionOptions = Reflect.getMetadata(
      ENTITY_CRUD_PERMISSIONS_KEY,
      entityClass,
      methodName
    );

    // Check create permissions using the provided code snippet
    if (!(await permissions.createPermissionValidator(context))) {
      applyErrorStrategy(
        permissions.errorStrategy,
        `Unauthorized access to method ${methodName} in ${entityClass.name}`
      );
    }

    return next();
  };
}

type ReadPermissionsMiddlewareOptions = MiddlewareOptions & {
  indexName: string;
};
const DEFAULT_READ_PERMISSIONS_MIDDLEWARE_OPTIONS: ReadPermissionsMiddlewareOptions =
  {
    indexName: "id",
    ...DEFAULT_MIDDLEWARE_OPTIONS,
  };
export function UseReadPermissionValidatorMiddleware<
  T extends BaseEntity = EntityWithID
>(
  entityClass: ClassType<T>,
  repository: Repository<T>,
  options: ReadPermissionsMiddlewareOptions = DEFAULT_READ_PERMISSIONS_MIDDLEWARE_OPTIONS
): MiddlewareFn<ServiceContext> {
  return async ({ context, args, info }, next) => {
    // Validate permissions for the top-level entity
    const permissions: CRUDPermissionOptions = Reflect.getMetadata(
      ENTITY_CRUD_PERMISSIONS_KEY,
      entityClass
    );

    options = {
      ...DEFAULT_READ_PERMISSIONS_MIDDLEWARE_OPTIONS,
      ...options,
    };
    const indexValue = args[options.indexName];
    const entity = await repository.findOneBy({
      [options.indexName]: indexValue,
    } as FindOptionsWhere<T>);

    if (!entity) {
      applyErrorStrategy(
        `${entityClass.name}(${options.indexName}=${indexValue}) not found.`,
        {
          strategy: permissions.errorStrategy,
          obscureErrors: options.obscureErrors,
          errorProto: NotFoundError,
        }
      );
    }

    if (!(await permissions.readPermissionValidator(context, entity!))) {
      applyErrorStrategy(
        `Unauthorized read access to ${entityClass.name}(${options.indexName}=${indexValue})`,
        {
          strategy: permissions.errorStrategy,
          obscureErrors: options.obscureErrors,
          errorProto: UnauthorizedError,
        }
      );
    }

    // Recursive function to validate nested fields
    const fields = graphqlFields(info);
    await applyFieldReadPermissionsRecursively(
      fields,
      entity!,
      entityClass,
      context,
      options,
      []
    );

    return next();
  };
}

export function UpdatePermissionsMiddleware<T extends BaseEntity>(
  entityClass: ClassType<T>,
  methodName: string
): MiddlewareFn<ServiceContext> {
  return async ({ context, args, info }, next) => {
    // Retrieve permissions from metadata
    const permissions: CRUDPermissionOptions = Reflect.getMetadata(
      ENTITY_CRUD_PERMISSIONS_KEY,
      entityClass,
      methodName
    );

    // Check update permissions using the provided code snippet
    if (!(await permissions.updatePermissionValidator(context))) {
      applyErrorStrategy(
        permissions.errorStrategy,
        `Unauthorized access to method ${methodName} in ${entityClass.name}`
      );
    }

    return next();
  };
}

export function DeletePermissionsMiddleware<T extends BaseEntity>(
  entityClass: ClassType<T>,
  methodName: string
): MiddlewareFn<ServiceContext> {
  return async ({ context, args, info }, next) => {
    // Retrieve permissions from metadata
    const permissions: CRUDPermissionOptions = Reflect.getMetadata(
      ENTITY_CRUD_PERMISSIONS_KEY,
      entityClass,
      methodName
    );

    // Check delete permissions using the provided code snippet
    if (!(await permissions.deletePermissionValidator(context))) {
      applyErrorStrategy(
        permissions.errorStrategy,
        `Unauthorized access to method ${methodName} in ${entityClass.name}`
      );
    }

    return next();
  };
}

/**
 * Validates the class-level read permissions against all fields in a query on a given
 * entity and applies the appropriate errorStrategy to unauthorized fields in the query.
 *
 * graphql resolver functions or middlewares should pass any returned data through this
 * function before returning data to the graphql framework. this ensures that the
 * permissions are validated for all fields in a query and that the user is not exposed
 * to any data that they should not be able to access.
 *
 * Note: this function only filters based on entity level permissions. it does not filter
 * based on field level permissions. field level permissions are validated in the
 * resolver functions themselves which you can attach middlewares to.
 *
 * @param type The type of the entity.
 * @param fields The fields to validate.
 * @param context The context to validate the fields in.
 * @param options The options to validate the fields with.
 * @param entity The entity to validate the fields in.
 * @param path The path to the field.
 */
async function applyFieldReadPermissionsRecursively<T extends BaseEntity>(
  fields: any,
  entity: T,
  type: ClassType<T>,
  context: ServiceContext,
  options: MiddlewareOptions,
  path: string[] = []
): Promise<void> {
  for (const fieldName in fields) {
    const fieldType = Reflect.getMetadata(
      "design:type",
      type.prototype,
      fieldName
    ) as ClassType<BaseEntity>;
    const subEntityTypesCRUDPermissions: CRUDPermissionOptions | undefined =
      Reflect.getMetadata(ENTITY_CRUD_PERMISSIONS_KEY, fieldType);

    const subFields = fields[fieldName];
    if (typeof subFields === "object" && Object.keys(subFields).length > 0) {
      const subEntity = entity[fieldName as keyof T] as BaseEntity;

      if (subEntityTypesCRUDPermissions && subEntity) {
        const isAuthorized =
          await subEntityTypesCRUDPermissions.readPermissionValidator(
            context,
            subEntity
          );
        if (!isAuthorized) {
          applyErrorStrategy(
            `Unauthorized access to nested field ${path}.${fieldName}`,
            {
              strategy: subEntityTypesCRUDPermissions.errorStrategy,
              obscureErrors: options.obscureErrors,
              errorProto: UnauthorizedError,
            }
          );
        }
      }

      if (subEntity) {
        await applyFieldReadPermissionsRecursively(
          subFields,
          subEntity,
          fieldType,
          context,
          options,
          [...path, fieldName]
        );
      }
    }
  }
}

type ApplyErrorStrategyOptions = {
  obscureErrors: boolean;
  strategy: "throw" | "null" | "ignore";
  errorProto: Constructor<Error, [string]>;
  obscuredErrorMessage: string;
  obscuredErrorProto: Constructor<Error, [string]>;
};
const DEFAULT_APPLY_ERROR_STRATEGY_OPTIONS: ApplyErrorStrategyOptions = {
  obscureErrors: false,
  strategy: "throw",
  errorProto: Error,
  obscuredErrorMessage: "Error",
  obscuredErrorProto: Error,
};
function applyErrorStrategy(
  message: string,
  options: Partial<ApplyErrorStrategyOptions> = DEFAULT_APPLY_ERROR_STRATEGY_OPTIONS
) {
  const {
    obscureErrors,
    strategy,
    errorProto,
    obscuredErrorMessage,
    obscuredErrorProto,
  } = {
    ...DEFAULT_APPLY_ERROR_STRATEGY_OPTIONS,
    ...options,
  };
  if (strategy === "throw") {
    if (obscureErrors) {
      throw new obscuredErrorProto(obscuredErrorMessage);
    } else {
      throw new errorProto(message);
    }
  } else if (strategy === "null") {
    return null;
  }
}
