import { DataSource } from "typeorm";
import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "./config";

//Entities

export const AppDataSource = new DataSource({
  type: "mysql",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: ["query", "error"],
  entities: [
    __dirname + "/../entities/**/*.{ts,js}",
  ],
  migrations: [__dirname + "/../migrations/**/*.{ts,js}"],
});
