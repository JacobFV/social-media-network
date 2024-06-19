import * as typeGQL from "type-graphql";
import { FindOptionsWhere, Repository } from "typeorm";
import "reflect-metadata";
import { appDataSource } from "@/core/db/appDataSource";
import Context from "@/utils/context";
import { isOwner, UsePermissionsMiddleware } from "@/utils/permissions";
import { EntityWithID } from "@/modules/base/entity";
import { Resolver } from "@/modules/base/resolver";

export function createCRUDResolver<T extends EntityWithID & typeGQL.ClassType>(
  Entity: T,
  name?: string
) {
  name = name ?? Entity.name;

  @typeGQL.Resolver(Entity)
  abstract class CRUDResolver extends Resolver {
    _repository: Repository<T> = appDataSource.getRepository<T>(Entity);

    @typeGQL.Query(() => [Entity], { name: `getAll${name}s` })
    async getAll(): Promise<T[]> {
      return this._repository.find();
    }

    @typeGQL.Query(() => Entity, { name: `get${name}` })
    async getOne(@typeGQL.Arg("id") id: number): Promise<T | null> {
      return this._repository.findOneBy({ id } as FindOptionsWhere<T>);
    }

    @typeGQL.Mutation(() => Entity, { name: `create${name}` })
    async create(@typeGQL.Arg("data") data: any): Promise<T> {
      const entities = this._repository.create([data]);
      const savedEntities = await this._repository.save(entities);
      return savedEntities[0];
    }

    @typeGQL.Mutation(() => Entity, { name: `update${name}` })
    @UsePermissionsMiddleware(isOwner(), ["owner"])
    async update(
      @typeGQL.Arg("id") id: number,
      @typeGQL.Arg("data") data: any,
      @typeGQL.Ctx() context: Context
    ): Promise<T | undefined> {
      const entity = await this._repository.findOneBy({
        id,
      } as FindOptionsWhere<T>);
      if (!entity) throw new Error(`${name} not found!`);

      Object.assign(entity, data);
      return this._repository.save(entity);
    }

    @typeGQL.Mutation(() => Boolean, { name: `delete${name}` })
    async delete(@typeGQL.Arg("id") id: number): Promise<boolean> {
      const entity = await this._repository.findOneBy({
        id,
      } as FindOptionsWhere<T>);
      if (!entity) throw new Error(`${name} not found!`);

      await this._repository.remove(entity);
      return true;
    }
  }

  return CRUDResolver;
}
