import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ClassType,
  UseMiddleware,
  Ctx,
} from "type-graphql";

import { Repository, getRepository } from "typeorm";
import { permissions } from "@/decorators/permissions";
import "reflect-metadata";

export function createCRUDResolvers<T extends ClassType>(
  Entity: T,
  name: string
) {
  @Resolver({ isAbstract: true })
  abstract class BaseResolver {
    protected repository: Repository<T>;

    constructor() {
      this.repository = getRepository(Entity);
    }

    @Query(() => [Entity], { name: `${name}s` })
    async getAll(): Promise<T[]> {
      return this.repository.find();
    }

    @Query(() => Entity, { name: `${name}` })
    async getOne(@Arg("id") id: number): Promise<T | undefined> {
      return this.repository.findOne(id);
    }

    @Mutation(() => Entity, { name: `create${name}` })
    async create(@Arg("data") data: any): Promise<T> {
      const entity = this.repository.create(data);
      return this.repository.save(entity);
    }

    @Mutation(() => Entity, { name: `update${name}` })
    @UseMiddleware(permissions((context: Context) => userIsOwner(context)))
    async update(
      @Arg("id") id: number,
      @Arg("data") data: any,
      @Ctx() context: Context
    ): Promise<T | undefined> {
      const entity = await this.repository.findOne(id);
      if (!entity) throw new Error(`${name} not found!`);

      context.currentRecord = entity; // Set current record in context

      Object.assign(entity, data);
      return this.repository.save(entity);
    }

    @Mutation(() => Boolean, { name: `delete${name}` })
    async delete(@Arg("id") id: number): Promise<boolean> {
      const entity = await this.repository.findOne(id);
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
      "isQuery",
      Entity.prototype,
      propertyName
    );
    const isMutation = Reflect.getMetadata(
      "isMutation",
      Entity.prototype,
      propertyName
    );
    const returnType = Reflect.getMetadata(
      "returnType",
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
