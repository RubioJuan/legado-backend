// Type
import { JwtPayload } from "jsonwebtoken";
import { BoardLevel, BoardState, PlayerState, Role } from "../types/enums.types";

export interface JWTMock extends JwtPayload {
  id: number;
  username: string;
  role: Role;
}

// Definición para un método de pago individual
export interface PaymentMethod {
  type: string;      // ej: "nequi", "bancolombia", "wallet"
  value: string;     // ej: número de teléfono, número de cuenta, dirección de wallet
  accountType?: string; // ej: "Ahorros", "Corriente" (opcional, para Bancolombia)
  // Otros campos que puedan ser necesarios en el futuro
}

// Interfaz para la información contextual de un jugador en un tablero, vista por un General
export interface PlayerInBoardContextual {
  id?: number; // User ID
  username: string;
  phoneNumber?: string;
  state: PlayerState; // UserProcessState.name
  unlockCount?: number; // Contador de desbloqueos del usuario
  paymentMethods?: PaymentMethod[] | null;
  
  // Campos adicionales para el contexto del General
  idBoardRecluta: number | null; 
  isLockedByThisGeneral: boolean;
  lockReasonCode: string | null;
  additionalIds?: { 
    childUserIdToVerify?: number;
    childBoardIdToVerify?: number; 
  } | null;
}

export interface BoardMock {
  id: number;
  state: BoardState; // This should be the ID from BoardStateEntity based on cleanBoardToGetBoardById
  level: BoardLevel; // This is the name of the level
  // idLevelId: number; // This was in GetBoardMock before, but level name is usually what's needed.
                       // If ID is also needed, it can be re-added or client can map name to ID.
  createAt: Date;
}

export interface PositionPlayerMock {
  id?: number;
  username: string;
  state: PlayerState;
  phoneNumber?: string;
  paymentMethods?: PaymentMethod[] | null;
  triplicationOfId?: number | null;
}

// GetBoardMock ahora usa PlayerInBoardContextual para las posiciones de los jugadores
export interface GetBoardMock {
  id: number;
  goalScorer: PlayerInBoardContextual; // MODIFICADO
  creator1: PlayerInBoardContextual;   // MODIFICADO
  creator2: PlayerInBoardContextual;   // MODIFICADO
  generator1: PlayerInBoardContextual; // MODIFICADO
  generator2: PlayerInBoardContextual; // MODIFICADO
  generator3: PlayerInBoardContextual; // MODIFICADO
  generator4: PlayerInBoardContextual; // MODIFICADO
  defender1: PlayerInBoardContextual;  // MODIFICADO
  defender2: PlayerInBoardContextual;  // MODIFICADO
  defender3: PlayerInBoardContextual;  // MODIFICADO
  defender4: PlayerInBoardContextual;  // MODIFICADO
  defender5: PlayerInBoardContextual;  // MODIFICADO
  defender6: PlayerInBoardContextual;  // MODIFICADO
  defender7: PlayerInBoardContextual;  // MODIFICADO
  defender8: PlayerInBoardContextual;  // MODIFICADO
  level: BoardLevel; // Nombre del nivel
  idLevelId: number; // El ID numérico del nivel del tablero. DESCOMENTADO/AÑADIDO
                     // levelData.id está disponible en cleanBoardToGetBoardById
  state: number; // ID del estado del tablero (BoardStateEntity.id)
  currentBlockadeStage?: number | null; // Etapa de bloqueo actual, si existe
  createAt: Date;
}

// GetVerifyBoardMock ahora extiende GetBoardMock PERO sobrescribe los tipos de jugador
// si el contexto de verificación es más simple y no necesita los campos contextuales de bloqueo.
export interface GetVerifyBoardMock extends Omit<GetBoardMock, 
  'goalScorer' | 'creator1' | 'creator2' | 
  'generator1' | 'generator2' | 'generator3' | 'generator4' | 
  'defender1' | 'defender2' | 'defender3' | 'defender4' | 
  'defender5' | 'defender6' | 'defender7' | 'defender8'> {
  
  goalScorer: GetVerifyGoalScorerMock; // Tipo específico para verificación
  // Para los demás jugadores, en este contexto son más simples:
  creator1: PositionPlayerMock;
  creator2: PositionPlayerMock;
  generator1: PositionPlayerMock;
  generator2: PositionPlayerMock;
  generator3: PositionPlayerMock;
  generator4: PositionPlayerMock;
  defender1: PositionPlayerMock;
  defender2: PositionPlayerMock;
  defender3: PositionPlayerMock;
  defender4: PositionPlayerMock;
  defender5: PositionPlayerMock;
  defender6: PositionPlayerMock;
  defender7: PositionPlayerMock;
  defender8: PositionPlayerMock;
  // Los campos 'id', 'level', 'state', 'createAt' se heredan de GetBoardMock vía Omit
}

// GetVerifyGoalScorerMock puede extender PlayerInBoardContextual si necesita sus campos base
// o mantenerse como una extensión de PositionPlayerMock si su contexto es diferente.
// Por ahora, lo mantenemos extendiendo PositionPlayerMock, pero añadiendo los campos contextuales si son necesarios aquí también.
// O podría extender PlayerInBoardContextual y añadir los campos específicos de verificación.
// Para simplicidad y evitar cambios drásticos, si GetVerifyGoalScorerMock es SOLO para el contexto de verificación
// y no necesita los campos de isLockedByThisGeneral etc., puede quedar como está o extender PositionPlayerMock.
// Si SÍ los necesita, debería extender PlayerInBoardContextual.
// Asumamos por ahora que el contexto de GetVerify es diferente y no necesita los campos de bloqueo del general.
export interface GetVerifyGoalScorerMock extends PositionPlayerMock {
  id: number;
  ballsSended: number;
  ballsReceived: number;
  ballsReceivedConfirmed: number;
  triplicationDone: boolean;
}
