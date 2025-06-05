import "reflect-metadata";
import { AppDataSource } from "./config/db";

const createAllTablesSQL = `
-- 1. Crear tablas base (sin foreign keys)
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

-- 2. Crear tabla entity_user
CREATE TABLE IF NOT EXISTS entity_user (
    id int NOT NULL AUTO_INCREMENT,
    username varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    firstName varchar(255) NOT NULL,
    lastName varchar(255) NOT NULL,
    country varchar(255) NOT NULL,
    countryCode varchar(255) NOT NULL,
    phoneNumber varchar(255) NOT NULL,
    ballsSended int NOT NULL DEFAULT 0,
    ballsReceived int NOT NULL DEFAULT 0,
    ballsReceivedConfirmed int NOT NULL DEFAULT 0,
    beneficiatedNames json NULL,
    beneficiatedPhoneNumber json NULL,
    beneficiatedCountry json NULL,
    beneficiatedCountryCode json NULL,
    acceptMarketing tinyint NOT NULL DEFAULT 1,
    triplicationDone tinyint NOT NULL DEFAULT 0,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    idRole int NOT NULL,
    idUserState int NOT NULL,
    idLeftAssociation int NULL,
    idRightAssociation int NULL,
    idUserProcessState int NULL,
    idCaptain int NULL,
    triplicationOfId int NULL,
    passwordResetToken varchar(255) NULL,
    passwordResetExpires datetime NULL,
    securityQuestion text NULL,
    securityAnswerHash varchar(255) NULL,
    failedSecurityAttempts int NOT NULL DEFAULT 0,
    securityLockoutUntil datetime NULL,
    paymentMethods json NULL,
    secondaryBoardIdAsRecruit int NULL,
    secondaryBoardLevelIdAsRecruit int NULL,
    secondaryPositionAsRecruit varchar(255) NULL,
    canVerifyRecruits tinyint NOT NULL DEFAULT 0,
    creatorUserId int NULL,
    unlockCount int NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY IDX_entity_user_username (username)
);

-- 3. Crear tabla board
CREATE TABLE IF NOT EXISTS board (
    id int NOT NULL AUTO_INCREMENT,
    idGoalScorer int NULL,
    idCreator1 int NULL,
    idCreator2 int NULL,
    idGenerator1 int NULL,
    idGenerator2 int NULL,
    idGenerator3 int NULL,
    idGenerator4 int NULL,
    idDefender1 int NULL,
    idDefender2 int NULL,
    idDefender3 int NULL,
    idDefender4 int NULL,
    idDefender5 int NULL,
    idDefender6 int NULL,
    idDefender7 int NULL,
    idDefender8 int NULL,
    idLevelId int NOT NULL,
    idBoardState int NOT NULL,
    currentBlockadeStage int NULL,
    isAwaitingUserCreation tinyint NOT NULL DEFAULT 0,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

-- 4. Crear tabla subscription
CREATE TABLE IF NOT EXISTS subscription (
    id int NOT NULL AUTO_INCREMENT,
    idBoard int NOT NULL,
    idSubscriptionState int NULL,
    idUser int NOT NULL,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

-- 5. Crear tablas adicionales
CREATE TABLE IF NOT EXISTS association (
    id int NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id int NOT NULL AUTO_INCREMENT,
    idUser int NOT NULL,
    token varchar(255) NOT NULL,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS audit (
    id int NOT NULL AUTO_INCREMENT,
    action varchar(255) NOT NULL,
    entityName varchar(255) NOT NULL,
    entityId int NOT NULL,
    userId int NOT NULL,
    changes json NULL,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tail (
    id int NOT NULL AUTO_INCREMENT,
    idUser int NOT NULL,
    createAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updateAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS general_awaiting_recruit_slot (
    id int NOT NULL AUTO_INCREMENT,
    userId int NOT NULL,
    primaryBoardId int NOT NULL,
    primaryLevelId int NOT NULL,
    targetRecruitLevelId int NOT NULL,
    reasonForWaiting varchar(255) NULL,
    createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);
`;

async function createAllTables() {
  try {
    console.log("🔧 Creando todas las tablas manualmente...");
    
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Ejecutar el SQL completo
    const statements = createAllTablesSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`📝 Ejecutando statement ${i + 1}/${statements.length}...`);
        await AppDataSource.query(statement);
      }
    }
    
    console.log("\n✅ Todas las tablas creadas exitosamente!");
    
    // Verificar tablas creadas
    const tables = await AppDataSource.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'legado_db'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`\n📊 Tablas en la base de datos (${tables.length}):`);
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });
    
    await AppDataSource.destroy();
    console.log("\n✅ ¡Listo! Ahora puedes ejecutar npm run dev");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

createAllTables(); 