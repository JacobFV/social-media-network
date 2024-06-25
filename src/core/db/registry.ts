import {
  BaseEntity,
  DataSource,
  EntitySchema,
  getManager,
  Repository,
} from "typeorm";

export const entities: (Function | EntitySchema)[] = [];

export function registerEntity(entity: Function | EntitySchema) {
  entities.push(entity);
  return entity;
}

export function getRepositoryForType<T extends BaseEntity>(
  type: new () => T
): Repository<T> {
  const repository = getManager().getRepository(type);
  if (!repository) {
    throw new Error(`Repository not found for given type: ${type.name}`);
  }
  return repository;
}
