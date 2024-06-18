import { config } from "@/core/config";
import { singleton } from "@/utils/singleton-runner";
import { DataSource, EntitySchema } from "typeorm";

let appDataSource: DataSource;
const entities: (Function | EntitySchema)[] = [];

const ensureDataSourceInitialized = singleton(async () => {
  if (appDataSource) {
    console.debug("Data source already initialized!");
    return;
  }
  console.debug("Initializing data source...");
  appDataSource = new DataSource({
    type: "postgres",
    host: config.databaseHost,
    port: config.databasePort,
    username: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    entities: entities,
  });
  console.debug("Data source has been initialized!");
});

export async function getDataSource() {
  await ensureDataSourceInitialized();
  return appDataSource;
}

export function registerEntity(entity: Function | EntitySchema) {
  entities.push(entity);
  return entity;
}
