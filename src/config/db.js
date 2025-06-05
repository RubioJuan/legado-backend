"use strict";
exports.__esModule = true;
exports.AppDataSource = void 0;
var typeorm_1 = require("typeorm");
var config_1 = require("./config");
//Entities
var association_entity_1 = require("../entities/association.entity");
var audit_entity_1 = require("../entities/audit.entity");
var board_state_entity_1 = require("../entities/board-state.entity");
var board_entity_1 = require("../entities/board.entity");
var GeneralAwaitingRecruitSlot_1 = require("../entities/GeneralAwaitingRecruitSlot");
var level_entity_1 = require("../entities/level.entity");
var password_reset_tokens_entity_1 = require("../entities/password_reset_tokens.entity");
var role_entity_1 = require("../entities/role.entity");
var subscription_state_entity_1 = require("../entities/subscription-state.entity");
var subscription_entity_1 = require("../entities/subscription.entity");
var tail_entity_1 = require("../entities/tail.entity");
var user_process_state_entity_1 = require("../entities/user-process-state.entity");
var user_state_entity_1 = require("../entities/user-state.entity");
var user_entity_1 = require("../entities/user.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: config_1.DB_HOST,
    port: config_1.DB_PORT,
    username: config_1.DB_USER,
    password: config_1.DB_PASSWORD,
    database: config_1.DB_NAME,
    synchronize: false,
    // synchronize: false,
    // migrationsRun: true,
    logging: ["query", "error"],
    entities: [
        user_entity_1.EntityUser,
        user_state_entity_1.UserState,
        user_process_state_entity_1.UserProcessState,
        role_entity_1.Role,
        board_entity_1.Board,
        board_state_entity_1.BoardState,
        level_entity_1.Level,
        subscription_entity_1.Subscription,
        subscription_state_entity_1.SubscriptionState,
        audit_entity_1.Audit,
        tail_entity_1.Tail,
        password_reset_tokens_entity_1.PasswordResetTokens,
        association_entity_1.Association,
        GeneralAwaitingRecruitSlot_1.GeneralAwaitingRecruitSlot,
    ],
    // subscribers: [],
    migrations: ["src/migrations/*.ts"]
});
