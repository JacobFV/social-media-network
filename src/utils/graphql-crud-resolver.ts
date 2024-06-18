import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ClassType,
  UseMiddleware,
  Ctx,
} from "type-graphql";

import { FindOptionsWhere, Repository } from "typeorm";
import "reflect-metadata";
import { appDataSource } from "@/core/db/appDataSource";
import Context from "@/utils/context";
import { isOwner } from "@/utils/permissions";
import { EntityWithID } from "@/entity/base";

export function createCRUDResolvers<T extends EntityWithID<T> & ClassType>(
  Entity: T,
  name?: string
) {
  name = name ?? Entity.name;

  @Resolver(Entity)
  abstract class BaseResolver {
    protected repository: Repository<T> =
      appDataSource.getRepository<T>(Entity);

    @Query(() => [Entity], { name: `getAll${name}s` })
    async getAll(): Promise<T[]> {
      return this.repository.find();
    }

    @Query(() => Entity, { name: `get${name}` })
    async getOne(@Arg("id") id: number): Promise<T | null> {
      return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
    }

    @Mutation(() => Entity, { name: `create${name}` })
    async create(@Arg("data") data: any): Promise<T> {
      const entities = this.repository.create([data]);
      const savedEntities = await this.repository.save(entities);
      return savedEntities[0];
    }

    @Mutation(() => Entity, { name: `update${name}` })
    @UsePermissionsMiddleware(isOwner, ["owner"])
    async update(
      @Arg("id") id: number,
      @Arg("data") data: any,
      @Ctx() context: Context
    ): Promise<T | undefined> {
      const entity = await this.repository.findOneBy({
        id,
      } as FindOptionsWhere<T>);
      if (!entity) throw new Error(`${name} not found!`);

      Object.assign(entity, data);
      return this.repository.save(entity);
    }

    @Mutation(() => Boolean, { name: `delete${name}` })
    async delete(@Arg("id") id: number): Promise<boolean> {
      const entity = await this.repository.findOneBy({
        id,
      } as FindOptionsWhere<T>);
      if (!entity) throw new Error(`${name} not found!`);

      await this.repository.remove(entity);
      return true;
    }
  }

  const resolver = new BaseResolver();

  // Automatically find and inject custom resolvers
  Object.getOwnPropertyNames(Entity).forEach((propertyName) => {
    const method = (Entity as any)[propertyName];
    const isQuery = Reflect.getMetadata(
      "type-server:isQuery",
      Entity.prototype,
      propertyName
    );
    const isMutation = Reflect.getMetadata(
      "type-server:isMutation",
      Entity.prototype,
      propertyName
    );
    const returnType = Reflect.getMetadata(
      "type-server:returnType",
      Entity.prototype,
      propertyName
    );

    if (isQuery) {
      Query(() => returnType, { name: `${name}${propertyName}` })(
        resolver,
        propertyName,
        Object.getOwnPropertyDescriptor(Entity, propertyName)!
      );
    }

    if (isMutation) {
      Mutation(() => returnType, { name: `${name}${propertyName}` })(
        resolver,
        propertyName,
        Object.getOwnPropertyDescriptor(Entity, propertyName)!
      );
    }
  });

  return resolver;
}

// function UsePermissionsMiddleware(isOwner: () => (context: Context) => Promise<boolean>, arg1: string[]): (target: BaseResolver, propertyKey: "update", descriptor: TypedPropertyDescriptor<(id: number, data: any, context: Context) => Promise<T | undefined>>) => void | TypedPropertyDescriptor<...> {
//   throw new Error("Function not implemented.");
// }
