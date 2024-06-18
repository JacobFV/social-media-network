import "reflect-metadata";
import {
  pgTable,
  AnyPgColumn,
  pgSchema,
  PgSchema,
  PgColumn,
  serial,
  PgColumnBuilderBase,
} from "drizzle-orm/pg-core";

const DRIZZLE_COLUMN_METADATA_KEY = "drizzle-annotation-utils:drizzle-column";

export function DrizzleColumn(
  columnOrFactory:
    | PgColumnBuilderBase
    | ((schema: PgSchema) => PgColumnBuilderBase)
) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(
      DRIZZLE_COLUMN_METADATA_KEY,
      columnOrFactory,
      target,
      propertyKey
    );
  };
}

export function initializeSchema(
  entities: Function[],
  schema?: PgSchema
): PgSchema {
  schema = schema ?? pgSchema("public");
  for (const entity of entities) {
    const prototype = entity.prototype;
    const propertyKeys = Object.getOwnPropertyNames(prototype).filter(
      (key) => typeof prototype[key] !== "function"
    );

    const columns: Record<string, PgColumnBuilderBase> = {};
    const deferredColumns = [];

    for (const propertyKey of propertyKeys) {
      const columnOrFactory = Reflect.getMetadata(
        DRIZZLE_COLUMN_METADATA_KEY,
        prototype,
        propertyKey
      );
      if (!columnOrFactory) continue; // Skip properties without the DrizzleColumn decorator

      if (typeof columnOrFactory === "function") {
        deferredColumns.push({ propertyKey, columnOrFactory });
      } else {
        columns[propertyKey] = columnOrFactory;
      }
    }
    const table = schema.table(entity.name.toLowerCase(), columns);

    // Now handle deferred columns
    for (const { propertyKey, columnOrFactory } of deferredColumns) {
      table[propertyKey] = columnOrFactory(schema);
    }
  }
  return schema;
}
