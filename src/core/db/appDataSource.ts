import { config } from "@/core/config";
import { entities } from "@/core/db/registry";
import { singleton } from "@/utils/singleton-runner";
import { DataSource, EntitySchema } from "typeorm";

export const appDataSource = new DataSource({
  type: "postgres",
  host: config.databaseHost,
  port: config.databasePort,
  username: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  entities: entities,
});

const ensureDataSourceInitialized = singleton(async () => {
  if (appDataSource.isInitialized) {
    console.debug("Data source already initialized!");
    return;
  }
  console.debug("Initializing data source...");
  await appDataSource.initialize();
  console.debug("Data source has been initialized!");
});

export async function getDataSource() {
  await ensureDataSourceInitialized();
  return appDataSource;
}
