export enum Role {
  PLAYER = "PLAYER",
  ADMINISTRATOR = "ADMINISTRATOR",
}

export enum BoardState {
  WAITING = "WAITING",
  PROCESS = "PROCESS",
  BLOCKED = "BLOCKED",
  CLOSED = "CLOSED",
}

export enum BoardLevel {
  OLÍMPICO = "Génesis",
  CENTENARIO = "Armagedón",
  AZTECA = "Apolo",
  MONUMENTAL = "Neptuno",
}

export enum PlayerState {
  WAITING = "WAITING",
  PROCESS = "PROCESS",
  VALIDATING = "VALIDATING",
  VALIDATED = "VALIDATED",
  BLOCKED = "BLOCKED",
}

// Nuevo Enum para IDs numéricos de Niveles de Tablero
export enum BoardLevelNumericId {
  GENESIS = 1,
  ARMAGEDON = 2,
  APOLO = 3,
  NEPTUNO = 4
}

export interface ArmageddonError {
  code: string;
  details: string;
}

export enum UserProcessStateId {
  WAITING = 1,
  PROCESS = 2,
  VALIDATING = 3,
  VALIDATED = 4,
  READY_TO_ACCEPT = 5,
  COMPLETADO = 6,
  EN_COLA = 7
}

// Nuevo Enum para IDs numéricos de Estados de Tablero
export enum BoardStateNumericId {
  WAITING = 1,      // Confirmar estos IDs con la base de datos
  PROCESS = 2,      // Confirmar estos IDs con la base de datos
  BLOCKED = 3,      // Confirmar estos IDs con la base de datos
  CLOSED = 4,       // Confirmar estos IDs con la base de datos
  // PENDIENTE_GC = 5 // Ejemplo si existe, confirmar IDs
}