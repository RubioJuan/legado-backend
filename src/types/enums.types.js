"use strict";
exports.__esModule = true;
exports.BoardStateNumericId = exports.UserProcessStateId = exports.BoardLevelNumericId = exports.PlayerState = exports.BoardLevel = exports.BoardState = exports.Role = void 0;
var Role;
(function (Role) {
    Role["PLAYER"] = "PLAYER";
    Role["ADMINISTRATOR"] = "ADMINISTRATOR";
})(Role = exports.Role || (exports.Role = {}));
var BoardState;
(function (BoardState) {
    BoardState["WAITING"] = "WAITING";
    BoardState["PROCESS"] = "PROCESS";
    BoardState["BLOCKED"] = "BLOCKED";
    BoardState["CLOSED"] = "CLOSED";
})(BoardState = exports.BoardState || (exports.BoardState = {}));
var BoardLevel;
(function (BoardLevel) {
    BoardLevel["OL\u00CDMPICO"] = "G\u00E9nesis";
    BoardLevel["CENTENARIO"] = "Armaged\u00F3n";
    BoardLevel["AZTECA"] = "Apolo";
    BoardLevel["MONUMENTAL"] = "Neptuno";
})(BoardLevel = exports.BoardLevel || (exports.BoardLevel = {}));
var PlayerState;
(function (PlayerState) {
    PlayerState["WAITING"] = "WAITING";
    PlayerState["PROCESS"] = "PROCESS";
    PlayerState["VALIDATING"] = "VALIDATING";
    PlayerState["VALIDATED"] = "VALIDATED";
    PlayerState["BLOCKED"] = "BLOCKED";
})(PlayerState = exports.PlayerState || (exports.PlayerState = {}));
// Nuevo Enum para IDs numéricos de Niveles de Tablero
var BoardLevelNumericId;
(function (BoardLevelNumericId) {
    BoardLevelNumericId[BoardLevelNumericId["GENESIS"] = 1] = "GENESIS";
    BoardLevelNumericId[BoardLevelNumericId["ARMAGEDON"] = 2] = "ARMAGEDON";
    BoardLevelNumericId[BoardLevelNumericId["APOLO"] = 3] = "APOLO";
    BoardLevelNumericId[BoardLevelNumericId["NEPTUNO"] = 4] = "NEPTUNO";
})(BoardLevelNumericId = exports.BoardLevelNumericId || (exports.BoardLevelNumericId = {}));
// Nuevo Enum para IDs numéricos de Estados de Proceso de Usuario
var UserProcessStateId;
(function (UserProcessStateId) {
    UserProcessStateId[UserProcessStateId["WAITING"] = 1] = "WAITING";
    UserProcessStateId[UserProcessStateId["PROCESS"] = 2] = "PROCESS";
    UserProcessStateId[UserProcessStateId["VALIDATING"] = 3] = "VALIDATING";
    UserProcessStateId[UserProcessStateId["VALIDATED"] = 4] = "VALIDATED";
    UserProcessStateId[UserProcessStateId["BLOCKED"] = 5] = "BLOCKED";
    UserProcessStateId[UserProcessStateId["COMPLETADO"] = 6] = "COMPLETADO";
    UserProcessStateId[UserProcessStateId["EN_COLA"] = 7] = "EN_COLA"; // NUEVO ID para jugadores en espera en la tabla 'tail'
})(UserProcessStateId = exports.UserProcessStateId || (exports.UserProcessStateId = {}));
// Nuevo Enum para IDs numéricos de Estados de Tablero
var BoardStateNumericId;
(function (BoardStateNumericId) {
    BoardStateNumericId[BoardStateNumericId["WAITING"] = 1] = "WAITING";
    BoardStateNumericId[BoardStateNumericId["PROCESS"] = 2] = "PROCESS";
    BoardStateNumericId[BoardStateNumericId["BLOCKED"] = 3] = "BLOCKED";
    BoardStateNumericId[BoardStateNumericId["CLOSED"] = 4] = "CLOSED";
    // PENDIENTE_GC = 5 // Ejemplo si existe, confirmar IDs
})(BoardStateNumericId = exports.BoardStateNumericId || (exports.BoardStateNumericId = {}));
