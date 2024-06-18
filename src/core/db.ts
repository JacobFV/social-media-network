import drizzle from "drizzle-orm";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "password",
  database: "social_media_network",
};

const dbConnection = drizzle.createConnection(dbConfig);

export default db;
