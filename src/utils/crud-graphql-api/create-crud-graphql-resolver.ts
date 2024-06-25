import "reflect-metadata";
import * as typeGQL from "type-graphql";
import { FindOptionsWhere, Repository } from "typeorm";
import { appDataSource } from "@/core/db/appDataSource";
import ServiceContext from "@/utils/context";
import { EntityWithID } from "@/modules/base/entity";
import { Resolver as BaseResolver } from "@/modules/base/resolver";
import {
  AbstractClassType,
  ClassType,
  convertToDynamic,
  StaticOrDynamic,
} from "@/utils/types";
import {
  CRUDPermissionOptions,
  ENTITY_CRUD_PERMISSIONS_KEY,
  UseReadPermissionValidatorMiddleware,
} from "@/utils/crud-graphql-api/entity-permissions";
import { UseMiddleware } from "type-graphql";

export function createCRUDResolver<T extends EntityWithID & typeGQL.ClassType>(
  Entity: typeGQL.ClassType<T>
) {
  const crudPermissionsOptions: CRUDPermissionOptions = Reflect.getMetadata(
    ENTITY_CRUD_PERMISSIONS_KEY,
    Entity
  );
  const name = crudPermissionsOptions.name ?? Entity.name;
  const repository = appDataSource.getRepository<T>(Entity);

  @typeGQL.Resolver(Entity)
  class BaseCRUDResolver extends BaseResolver {
    public _repository: Repository<T> = repository;
  }
  let resolverClass: ClassType<BaseCRUDResolver> = BaseCRUDResolver;

  if (crudPermissionsOptions.enableCreate) {
    class CreateResolver extends resolverClass {
      @typeGQL.Mutation(() => Entity, { name: `create${name}` })
      @UseMiddleware(ClassCreatePermissionsMiddleware(Entity, repository))
      async create(@typeGQL.Arg("data") data: any): Promise<T> {
        const entities = this._repository.create([data]);
        const savedEntities = await this._repository.save(entities);
        return savedEntities[0];
      }
    }
    resolverClass = CreateResolver;
  }
  if (crudPermissionsOptions.enableRead) {
    class ReadResolver extends resolverClass {
      @typeGQL.Query(() => [Entity], { name: `getAll${name}s` })
      @UseMiddleware(ClassQueryPermissionsMiddleware(Entity, repository))
      async getAll(@typeGQL.Ctx() context: ServiceContext): Promise<T[]> {
        const entities = await this._repository.find();
        return entities.filter((entity) =>
          crudPermissionsOptions.readPermissionValidator(context, entity)
        );
      }

      @typeGQL.Query(() => Entity, { name: `get${name}` })
      @UseMiddleware(UseReadPermissionValidatorMiddleware(Entity, repository))
      async getOne(
        @typeGQL.Arg("id") id: number,
        @typeGQL.Ctx() context: ServiceContext
      ): Promise<T | null> {
        if (context.selectedEntityFromAuthMiddleware) {
          return context.selectedEntityFromAuthMiddleware;
        }
        const entity = this._repository.findOneBy({
          id,
        } as FindOptionsWhere<T>);
        if (!crudPermissionsOptions.readPermissionValidator(context, entity)) {
          throw new Error(`Unauthorized access to ${name}`);
        }
        if (!entity) throw new Error(`${name} not found!`);
        return entity;
      }
    }
    resolverClass = ReadResolver;
  }
  if (crudPermissionsOptions.enableUpdate) {
    class UpdateResolver extends resolverClass {
      @typeGQL.Mutation(() => Entity, { name: `update${name}` })
      @UseMiddleware(ClassUpdatePermissionsMiddleware(Entity))
      async update(
        @typeGQL.Arg("id") id: number,
        @typeGQL.Arg("data") data: any,
        @typeGQL.Ctx() context: ServiceContext
      ): Promise<T | undefined> {
        const entity = await this._repository.findOneBy({
          id,
        } as FindOptionsWhere<T>);
        if (!entity) throw new Error(`${name} not found!`);

        Object.assign(entity, data);
        return this._repository.save(entity);
      }
    }
    resolverClass = UpdateResolver;
  }
  if (crudPermissionsOptions.enableDelete) {
    class DeleteResolver extends resolverClass {
      @typeGQL.Mutation(() => Boolean, { name: `delete${name}` })
      @UseMiddleware(ClassDeletePermissionsMiddleware(Entity))
      async delete(@typeGQL.Arg("id") id: number): Promise<boolean> {
        const entity = await this._repository.findOneBy({
          id,
        } as FindOptionsWhere<T>);
        if (!entity) throw new Error(`${name} not found!`);

        await this._repository.remove(entity);
        return true;
      }
    }
    resolverClass = DeleteResolver;
  }

  return resolverClass;
}
