import "reflect-metadata";
import { AppDataSource } from "./config/db";

const createTablesSQL = `
-- Crear tablas base necesarias
CREATE TABLE IF NOT EXISTS board_state (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_board_state_name (name)
);

CREATE TABLE IF NOT EXISTS user_state (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_user_state_name (name)
);

CREATE TABLE IF NOT EXISTS user_process_state (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_user_process_state_name (name)
);

CREATE TABLE IF NOT EXISTS role (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_role_name (name)
);

CREATE TABLE IF NOT EXISTS subscription_state (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_subscription_state_name (name)
);

CREATE TABLE IF NOT EXISTS level (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY IDX_level_name (name)
);
`;

async function createTables() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conexión establecida");
    
    // Ejecutar SQL para crear tablas
    await AppDataSource.query(createTablesSQL);
    console.log("✅ Tablas base creadas exitosamente!");
    
    await AppDataSource.destroy();
    console.log("✅ Conexión cerrada");
    
  } catch (error) {
    console.error("❌ Error creando tablas:", error);
  }
}

createTables(); 