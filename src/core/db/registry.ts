import { DataSource, EntitySchema } from "typeorm";

export const entities: (Function | EntitySchema)[] = [];

export function registerEntity(entity: Function | EntitySchema) {
  entities.push(entity);
  return entity;
}
