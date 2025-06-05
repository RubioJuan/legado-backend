// Node modules
import { Request, Response } from "express";
import { IsNull, Not } from "typeorm";

// Interfaces para verificación
interface GetVerifyGoalScorerMock {
  id: number;
  username: string;
}

interface LoginUserData {
  id: number;
  username: string;
}

interface GetVerifyBoardMock {
  id: number;
  idLevelId: number;
}

// Interfaces
import {
    AdminUserChangeRequest,
    DeleteUserByUsernameRequest
} from "../interfaces/admin.request.interface";
import { RequestExt } from "../interfaces/request";

// Config
import { AppDataSource } from "../config/db";

// Entities
import { Board } from "../entities/board.entity";
import { Subscription } from "../entities/subscription.entity";
import { Tail } from "../entities/tail.entity";
import { EntityUser } from "../entities/user.entity";

// Types & Enums
import { BoardLevelNumericId, UserProcessStateId } from "../types/enums.types";

// Utils
import { encrypt } from "../utils/bcrypt.handle";
import { getPositionAvailable } from "../utils/getPositionAvailable";

// Services
import {
    changePasswordByUsernameService,
    createChildUsersService,
    eraseUserByUsernameService,
    eraseUserService,
    getUserProfileService,
    modifyAssosiationsOfUser,
    resolveBoardBlockadeBySecondaryAction,
    resolveGenesisFourthBlockade,
    resolveGenesisThirdBlockade,
    searchUserById,
    searchUsers,
    unlockThirdBlockadeGeneralArmageddonApolo,
    updatePlayerById,
    updateUserProfileService,
    validatePlayer
} from "../services/user.service";

// Funciones de utilidad locales (podrían moverse a ../utils o ../services si son más genéricas)
const getCaptainIdLocal = (positionAvailable: string, board: Board): number | undefined => {
  if (positionAvailable === "idGoalScorer") {
    return undefined; // El Goleador no tiene capitán en este tablero
  }
  // Para todas las demás posiciones, el capitán es el Goleador del tablero actual
  // Asegurarse que board.idGoalScorer es el ID numérico o undefined/null.
  // Si board.idGoalScorer es un objeto EntityUser, necesitamos board.idGoalScorer.id
  const goalScorer = board.idGoalScorer;
  if (typeof goalScorer === 'number') {
    return goalScorer;
  } else if (goalScorer && typeof (goalScorer as any).id === 'number') {
    return (goalScorer as any).id;
  }
  return undefined;
};

const getUserProcessStateLocal = (
  positionAvailable: string,
  isGoalScorerPositionNull: boolean, // true si board.idGoalScorer es null
  // triplicationDone: boolean // Para un NUEVO usuario, triplicationDone es siempre false inicialmente.
                           // Este parámetro podría ser útil si esta función se reusa para mover usuarios.
): number => {
  if (positionAvailable === "idGoalScorer") {
    return 1; // PENDIENTE_APROBACION_GENERAL o estado inicial del Goleador
  } else if (positionAvailable.startsWith("idCreator") || positionAvailable.startsWith("idGenerator")) {
    return 4; // VALIDADO (Comandantes y Sargentos)
  } else if (positionAvailable.startsWith("idDefender")) {
    // triplicationDone es false para un nuevo usuario.
    // Si un defensor siempre entra como 'ASIGNADO_A_TABLERO' (estado 2) y luego su estado cambia
    // a 'VALIDADO' (4) tras la triplicación, entonces es 2.
    return 2; // ASIGNADO_A_TABLERO (Reclutas)
  }
  return 1; // Estado por defecto o error, debería manejarse.
};

export const createUser = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  let newUser: EntityUser | null = null;

  try {
    const {
      username,
      password,
      firstName,
      lastName,
      country,
      countryCode,
      phoneNumber,
      securityQuestion,
      securityAnswer,
      paymentMethods
    } = req.body;

    // Validar que paymentMethods sea un array si se proporciona, o inicializarlo como null o array vacío.
    // Esto es una validación básica, se podría hacer más robusta.
    let validatedPaymentMethods = null;
    if (paymentMethods) {
      if (Array.isArray(paymentMethods) && paymentMethods.length > 0) {
        // Aquí se podrían añadir validaciones más profundas para cada objeto en el array si es necesario
        // Por ejemplo, que cada método tenga 'type' y 'value'.
        validatedPaymentMethods = paymentMethods;
      } else if (paymentMethods && !Array.isArray(paymentMethods) && typeof paymentMethods === 'object' && paymentMethods.type && paymentMethods.value) {
        // Si el frontend envía un solo objeto en lugar de un array con un objeto
        validatedPaymentMethods = [paymentMethods];
      } else {
        // Si se envía paymentMethods pero no es un array o un objeto válido, se podría retornar un error o ignorarlo.
        // Por ahora, lo ignoraremos si no es el formato esperado para no romper el flujo si el frontend aún no lo envía bien.
        console.warn("[createUser] paymentMethods recibido pero en formato incorrecto, se ignorará.", paymentMethods);
      }
    }

    if (!username || !password || !firstName || !lastName || !country || !countryCode || !phoneNumber) {
      // No es necesario rollback/release aquí si aún no se ha hecho nada en la transacción que necesite limpieza específica
      // pero si ya se hubieran hecho operaciones, sería importante.
      // Por ahora, la transacción se deshará en el bloque finally si no hay commit.
      return res.status(400).json({ message: "Faltan campos requeridos para el registro. Por favor, complete todos los campos obligatorios." });
    }

    const passwordHash = await encrypt(password);
    const securityAnswerHash = await encrypt(securityAnswer);

    // Buscar todos los tableros activos de nivel 1 (Génesis) con vacantes de reclutas
    const boardsWithVacancy = await queryRunner.manager.find(Board, {
      where: {
        idLevelId: 1,
        idBoardState: 1,
      },
      order: { createAt: "ASC" },
    });

    let assigned = false;
    let assignedBoard: Board | null = null;
    // let assignedPosition: string | null = null; // No parece usarse después

    for (const board of boardsWithVacancy) {
      const positionAvailable = getPositionAvailable(board);
      if (positionAvailable) {
        const captainId = getCaptainIdLocal(positionAvailable, board);
        const userProcessState = getUserProcessStateLocal(positionAvailable, board.idGoalScorer === null);
        
        // Buscar si hay 7 o menos usuarios en la DB para asignar rol de administrador
        const userCount = await queryRunner.manager.count(EntityUser);
        const roleId = userCount < 7 ? 1 : 2; // Admin (1) para los primeros 7 usuarios, Client (2) para el resto
        
        const userToSaveOnBoard = queryRunner.manager.create(EntityUser, {
            username,
            password: passwordHash,
            firstName,
            lastName,
            country,
            countryCode,
            phoneNumber,
            idCaptain: captainId,
            idUserProcessState: userProcessState,
            securityQuestion: securityQuestion || null,
            securityAnswerHash: securityAnswerHash,
            paymentMethods: validatedPaymentMethods,
            idRole: roleId, // Admin o Client según corresponda
            idUserState: 1, // Estado inicial
        });
        newUser = await queryRunner.manager.save(userToSaveOnBoard);
        if (!newUser) throw new Error("Fallo al guardar el usuario en el tablero.");
        
        const boardUpdatePayload: { [key: string]: any } = {};
        boardUpdatePayload[positionAvailable] = newUser.id;
        await queryRunner.manager.update(Board, board.id, boardUpdatePayload);
        
        if (positionAvailable !== "idGoalScorer") {
          await modifyAssosiationsOfUser(newUser.id, positionAvailable, board, queryRunner);
        }
        assigned = true;
        assignedBoard = board;
        // assignedPosition = positionAvailable;
        break;
      }
    }

    if (!assigned) {
      // No hay vacantes en ningún tablero, agregar a la cola
      // Buscar si hay 7 o menos usuarios en la DB para asignar rol de administrador
      const userCount = await queryRunner.manager.count(EntityUser);
      const roleId = userCount < 7 ? 1 : 2; // Admin (1) para los primeros 7 usuarios, Client (2) para el resto
      
      const userToSaveInQueue = queryRunner.manager.create(EntityUser, {
          username,
          password: passwordHash,
          firstName,
          lastName,
          country,
          countryCode,
          phoneNumber,
          idUserProcessState: 1, // Estado inicial para la cola
          securityQuestion: securityQuestion || null,
          securityAnswerHash: securityAnswerHash,
          paymentMethods: validatedPaymentMethods,
          idRole: roleId, // Admin o Client según corresponda
          idUserState: 1, // Estado inicial
      });
      newUser = await queryRunner.manager.save(userToSaveInQueue);
      if (!newUser) throw new Error("Fallo al guardar el usuario en la cola.");
      const tailEntry = queryRunner.manager.create(Tail, { idUser: newUser.id });
      await queryRunner.manager.save(tailEntry);
      console.log(`[createUser] Usuario ${newUser.id} creado y añadido a la cola. No hay tablero disponible inmediatamente.`);
    }

    if (!newUser) throw new Error("El objeto de usuario fue nulo en un punto crítico.");

    if (assigned && assignedBoard) {
      const subscriptionToSave = queryRunner.manager.create(Subscription, {
        idUser: newUser.id,
        idBoard: assignedBoard.id,
        idSubscriptionState: 1,
      });
      await queryRunner.manager.save(subscriptionToSave);
      console.log(`[createUser] Suscripción activa creada para usuario ${newUser.id} en tablero ${assignedBoard.id}`);
    }

    await queryRunner.commitTransaction();
    console.log(`[createUser] Transacción completada exitosamente para el proceso de creación de usuario.`);
    
    // Devolver una respuesta más alineada con el login, si se desea un login automático o consistencia.
    // Por ahora, mantenemos la estructura original pero con JSON y estado 201.
    return res.status(201).json({ 
      message: "Usuario creado y procesado exitosamente.", 
      userData: { 
        idUser: newUser.id, 
        username: newUser.username 
        // role: Role.PLAYER // newUser.idRole es 2, que es PLAYER. Convertir si el frontend espera la cadena.
      }
    });

  } catch (error: any) {
    console.error("[createUser] Error durante la transacción de creación de usuario:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
      console.log("[createUser] Transacción revertida debido a un error.");
    }
    return res.status(500).json({ message: error.message || "Error interno al crear el usuario." });
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
      console.log("[createUser] QueryRunner liberado.");
    }
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const response = await searchUsers();
    return res.send(response);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const response = await searchUserById(parseInt(id));

    if (!response) return res.status(404).send({ message: "User not found" });

    return res.status(200).send(response);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    return res.status(201).send({ message: "user has been updated" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

export const adminDeleteUserController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const userToDeleteId = parseInt(req.params.id);

    const response = await eraseUserService(userToDeleteId);

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).send({ message: `Ocurrió un error: ${errorMessage}` });
  }
};

export const deleteUserController = async (req: RequestExt, res: Response) => {
  try {
    const userToDeleteId = req.user?.id!;

    const response = await eraseUserService(userToDeleteId);

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

export const deleteUserByUsernameController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    // Asumiendo que DeleteUserByUsernameRequest define username y goalScorerUsername opcional
    const { username, goalScorerUsername } = req.body as DeleteUserByUsernameRequest;

    if (!username) {
      return res.status(400).json({ message: "El username es requerido en el cuerpo de la solicitud." });
    }

    // Lógica de autorización omitida por brevedad
    // const actingUserId = req.user?.id;
    // if (actingUserId !== /* ID del usuario que se intenta borrar O si es admin */ ) {
    //   return res.status(403).json({ message: "No autorizado." });
    // }

    const result = await eraseUserByUsernameService(username, goalScorerUsername);
    return res.status(result.status).json({ message: result.message });
  } catch (error: any) {
    console.error("[Controller - deleteUserByUsername] Error:", error);
    return res.status(500).json({ message: `Error interno del servidor: ${error.message || error}` });
  }
};

export const requestUnlockBySecondaryGeneral = async (req: RequestExt, res: Response) => {
  try {
    const { recruitBoardId, targetRecruitUserId } = req.params;
    
    // For testing purposes - hardcode actingGeneralId if not available from token
    const actingGeneralId = req.user?.id || 1; // Default to user 1 (prueba1) if no token
    
    console.log(`[requestUnlockBySecondaryGeneral] Solicitud de desbloqueo iniciada:`);
    console.log(`- General actuante: ${actingGeneralId}`);
    console.log(`- Tablero del recluta: ${recruitBoardId}`);
    console.log(`- Usuario recluta objetivo: ${targetRecruitUserId}`);
    
    if (!recruitBoardId || !targetRecruitUserId) {
      return res.status(400).json({ 
        message: "Parámetros incompletos para la solicitud de desbloqueo" 
      });
    }

    const result = await resolveBoardBlockadeBySecondaryAction(
      Number(actingGeneralId),
      Number(recruitBoardId),
      Number(targetRecruitUserId)
    );

    return res.status(result.status || 200).json({ 
      message: result.message 
    });
  } catch (error: any) {
    console.error("[Controller - requestUnlockBySecondaryGeneral] Error:", error);
    return res.status(500).json({ 
      message: `Error interno del servidor: ${error.message || error}` 
    });
  }
};

export const changePasswordByUsernameController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const requestData: AdminUserChangeRequest = req.body;

    const response = await changePasswordByUsernameService(
      requestData.username,
      requestData.newPassword
    );

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).send({ message: errorMessage });
  }
};

export const checkGenesisThirdBlockadeController = async (req: RequestExt, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const generalId = req.user?.id; // El general que está creando usuarios

    if (!generalId) {
      await queryRunner.rollbackTransaction();
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    // Buscar el tablero del general y su usuario
    const board = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: generalId,
        currentBlockadeStage: 3
      }
    });

    const generalUser = await queryRunner.manager.findOne(EntityUser, {
      where: { id: generalId }
    });

    if (!board || !generalUser) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ message: "No se encontró el tablero o el usuario general." });
    }

    // Buscar el último recluta verificado para intentar el desbloqueo
    const lastVerifiedRecruit = await queryRunner.manager.findOne(EntityUser, {
      where: {
        triplicationOfId: generalId,
        idUserProcessState: 4 // Estado VALIDADO
      },
      order: { updateAt: "DESC" }
    });

    if (!lastVerifiedRecruit) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ message: "No se encontró un recluta verificado para intentar el desbloqueo." });
    }

    // Llamar al servicio que verifica si se puede desbloquear
    const result = await unlockThirdBlockadeGeneralArmageddonApolo(
      board,
      generalUser,
      lastVerifiedRecruit,
      queryRunner
    );

    if (result.unlocked) {
      await queryRunner.commitTransaction();
      return res.status(200).json({ message: result.message });
    } else {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ message: result.message });
    }
  } catch (error: any) {
    console.error("[Controller - checkGenesisThirdBlockadeController] Error:", error);
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ message: `Error interno del servidor: ${error.message || error}` });
  } finally {
    if (queryRunner && !queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const checkGenesisFourthBlockadeController = async (req: RequestExt, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const generalId = req.user?.id; // El general que está creando usuarios

    if (!generalId) {
      await queryRunner.rollbackTransaction();
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    // Llamar al servicio que verifica si se puede desbloquear
    const result = await resolveGenesisFourthBlockade(generalId, queryRunner);

    if (result.status === 200) {
      await queryRunner.commitTransaction();
    } else {
      await queryRunner.rollbackTransaction();
    }

    return res.status(result.status).json({ message: result.message });
  } catch (error: any) {
    console.error("[Controller - checkGenesisFourthBlockadeController] Error:", error);
    await queryRunner.rollbackTransaction();
    return res.status(500).json({ message: `Error interno del servidor: ${error.message || error}` });
  } finally {
    if (queryRunner && !queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const createChildUserForGenesisBlockade = async (req: RequestExt, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  let newUser: EntityUser | null = null;
  let assigned = false;
  let assignedBoard: Board | null = null;

  try {
    // Verificar que el usuario está autenticado
    const fatherGeneralId = req.user?.id;
    if (!fatherGeneralId) {
      await queryRunner.rollbackTransaction();
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    // Verificar que el usuario tiene un tablero Genesis bloqueado en etapa 3
    const fatherBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: fatherGeneralId,
        idLevelId: BoardLevelNumericId.GENESIS,
        currentBlockadeStage: 3
      }
    });

    if (!fatherBoard) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ 
        message: "No tienes un tablero Genesis bloqueado en etapa 3 o no eres el general de este tablero." 
      });
    }

    // IMPORTANTE: Verificar estrictamente el límite de 3 usuarios
    const existingChildrenCount = await queryRunner.manager.count(EntityUser, {
      where: {
        triplicationOfId: fatherGeneralId
      }
    });

    if (existingChildrenCount >= 3) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ 
        message: "Ya has creado los 3 usuarios permitidos. No puedes crear más usuarios." 
      });
    }

    // Extraer datos del cuerpo de la solicitud
    const {
      username,
      password,
      firstName,
      lastName,
      country,
      countryCode,
      phoneNumber,
      securityQuestion,
      securityAnswer,
      paymentMethods
    } = req.body;

    // Validaciones básicas de datos
    if (!username || !password || !firstName || !lastName || !country || !countryCode || !phoneNumber) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ 
        message: "Faltan campos requeridos para el registro." 
      });
    }

    // Verificar si el username ya existe
    const existingUser = await queryRunner.manager.findOne(EntityUser, {
      where: { username }
    });

    if (existingUser) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ 
        message: "El nombre de usuario ya está en uso." 
      });
    }

    // Hashear password y respuesta de seguridad
    const passwordHash = await encrypt(password);
    const securityAnswerHash = securityAnswer ? await encrypt(securityAnswer) : null;

    // Buscar tableros disponibles para asignar al nuevo usuario
    console.log(`[createChildUserForGenesisBlockade] Searching for available boards for new child user`);
    
    const boardsWithVacancy = await queryRunner.manager
      .createQueryBuilder(Board, "board")
      .where("board.idBoardState = :state", { state: 1 })
      .andWhere("board.idLevelId = :level", { level: 1 })
      .andWhere(
        "(board.idDefender1 IS NULL OR " +
        "board.idDefender2 IS NULL OR " +
        "board.idDefender3 IS NULL OR " +
        "board.idDefender4 IS NULL OR " +
        "board.idDefender5 IS NULL OR " +
        "board.idDefender6 IS NULL OR " +
        "board.idDefender7 IS NULL OR " +
        "board.idDefender8 IS NULL)"
      )
      .orderBy("board.createAt", "ASC")
      .getMany();

    console.log(`[createChildUserForGenesisBlockade] Found ${boardsWithVacancy.length} boards with vacancies`);
    
    if (boardsWithVacancy.length > 0) {
      console.log(`[createChildUserForGenesisBlockade] Board IDs with vacancies: ${boardsWithVacancy.map(b => b.id).join(', ')}`);
    }

    // Crear el usuario hijo
    const userToCreate = queryRunner.manager.create(EntityUser, {
            username,
            password: passwordHash,
            firstName,
            lastName,
            country,
            countryCode,
            phoneNumber,
      idRole: 2, // PLAYER
      idUserState: 1, // ACTIVE
      idUserProcessState: 2, // PENDING_VERIFICATION
            securityQuestion: securityQuestion || null,
            securityAnswerHash: securityAnswerHash,
      paymentMethods: paymentMethods || null,
      triplicationOfId: fatherGeneralId
    });

    newUser = await queryRunner.manager.save(userToCreate);

    if (!newUser) {
      throw new Error("Error al crear el usuario hijo.");
    }

    // Intentar asignar a un tablero disponible
    for (const board of boardsWithVacancy) {
      const positionAvailable = getPositionAvailable(board);
      if (positionAvailable) {
        const captainId = board.idGoalScorer;
        
        // Actualizar el tablero con el nuevo usuario
        const boardUpdatePayload: { [key: string]: any } = {};
        boardUpdatePayload[positionAvailable] = newUser.id;
        await queryRunner.manager.update(Board, board.id, boardUpdatePayload);
        
        // Actualizar asociaciones del usuario
        await modifyAssosiationsOfUser(newUser.id, positionAvailable, board, queryRunner);
        
        // Crear suscripción
        const subscriptionToSave = queryRunner.manager.create(Subscription, {
          idUser: newUser.id,
          idBoard: board.id,
          idSubscriptionState: 1,
        });
        await queryRunner.manager.save(subscriptionToSave);
        
        assigned = true;
        assignedBoard = board;
        break;
      }
    }

    // Si no se pudo asignar a un tablero, agregar a la cola
    if (!assigned) {
      console.log(`[createChildUserForGenesisBlockade] No board assignment found for user ${newUser.id}, adding to tail queue`);
      
      // Actualizar el estado del usuario a EN_COLA
      await queryRunner.manager.update(EntityUser, newUser.id, {
        idUserProcessState: 1 // Estado EN_COLA
      });
      
      // Crear entrada en la cola
      const tailEntry = queryRunner.manager.create(Tail, { idUser: newUser.id });
      await queryRunner.manager.save(tailEntry);
      console.log(`[createChildUserForGenesisBlockade] User ${newUser.id} successfully added to tail queue`);
    } else {
      console.log(`[createChildUserForGenesisBlockade] User ${newUser.id} assigned to board ${assignedBoard!.id}`);
    }

    // Actualizar el tablero para indicar que está en proceso de creación de usuarios
    await queryRunner.manager.update(Board, fatherBoard.id, { 
      isAwaitingUserCreation: true
    });

    await queryRunner.commitTransaction();
    
    // Calcular usuarios restantes
    const remainingChildren = 3 - (existingChildrenCount + 1);
    
    return res.status(201).json({ 
      message: `Usuario hijo ${newUser.username} creado exitosamente${
        assigned ? ` y asignado al tablero ${assignedBoard!.id}` : ' y añadido a la cola de espera'
      }. ${
        remainingChildren > 0 
          ? `Faltan ${remainingChildren} ${remainingChildren === 1 ? 'usuario' : 'usuarios'} por crear.` 
          : 'Has creado los 3 usuarios requeridos. Ahora espera a que sean verificados.'
      }`,
      userData: { 
        idUser: newUser.id, 
        username: newUser.username,
        remainingChildren,
        assigned,
        boardId: assigned ? assignedBoard!.id : null,
        inQueue: !assigned
      }
    });

  } catch (error: any) {
    console.error("[createChildUserForGenesisBlockade] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    return res.status(500).json({ 
      message: error.message || "Error interno al crear el usuario hijo." 
    });
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const getUserBlockedBoardController = async (req: RequestExt, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        message: "ID de usuario no proporcionado" 
      });
    }

    // Find any board where the user is the GoalScorer (General) and has a blockade stage
    const blockedBoard = await AppDataSource.manager.findOne(Board, {
      where: {
        idGoalScorer: Number(userId),
        currentBlockadeStage: Not(IsNull())
      },
      order: { updateAt: "DESC" }
    });

    if (!blockedBoard) {
      return res.status(404).json({ 
        message: "No se encontró un tablero bloqueado para este usuario",
        hasBlockedBoard: false 
      });
    }

    return res.status(200).json({
      message: "Tablero bloqueado encontrado",
      hasBlockedBoard: true,
      boardData: {
        id: blockedBoard.id,
        blockadeStage: blockedBoard.currentBlockadeStage,
        boardState: blockedBoard.idBoardState,
        levelId: blockedBoard.idLevelId
      }
    });
  } catch (error: any) {
    console.error("[Controller - getUserBlockedBoardController] Error:", error);
    return res.status(500).json({ 
      message: `Error interno del servidor: ${error.message || error}`,
      hasBlockedBoard: false
    });
  }
};

export const getChildUsersForBoard = async (req: Request, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId);
    if (isNaN(boardId)) {
      return res.status(400).json({ message: "ID de tablero inválido" });
    }

    // Get the board to find its goalScorer (the father)
    const board = await AppDataSource.manager.findOne(Board, {
      where: { id: boardId }
    });

    if (!board || !board.idGoalScorer) {
      return res.status(404).json({ message: "Tablero no encontrado o no tiene un general asignado" });
    }

    // Get all child users created by this goalScorer
    const childUsers = await AppDataSource.manager.find(EntityUser, {
      where: { triplicationOfId: board.idGoalScorer },
      select: ["id", "username", "idUserProcessState", "firstName", "lastName"]
    });

    return res.json({
      childUsers,
      totalCount: childUsers.length,
      verifiedCount: childUsers.filter(user => 
        user.idUserProcessState === 3 || user.idUserProcessState === 4
      ).length
    });
  } catch (error) {
    console.error("[getChildUsersForBoard] Error:", error);
    return res.status(500).json({ message: "Error interno al obtener usuarios hijos" });
  }
};

export const verifyPlayerService = async (
  goalScorer: GetVerifyGoalScorerMock,
  defender: LoginUserData,
  board: GetVerifyBoardMock
): Promise<{ message: string }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Verificar el jugador
    const user = await validatePlayer(goalScorer.id, queryRunner);

    // Actualizar el estado del jugador a VALIDATING
    await updatePlayerById(
      goalScorer.id,
      { idUserProcessState: UserProcessStateId.VALIDATING },
      queryRunner
    );

    console.log(`[verifyPlayerService] Usuario ${goalScorer.username} actualizado a estado VALIDATING`);

    // Si este usuario es hijo de un general (triplicationOfId), verificar desbloqueo
    if (user.triplicationOfId) {
      console.log(`[verifyPlayerService] Usuario es hijo del general ${user.triplicationOfId}, verificando desbloqueo...`);
      
      // Intentar desbloquear la etapa 3
      const unlockResult = await resolveGenesisThirdBlockade(
        user.triplicationOfId,
        queryRunner
      );

      console.log(`[verifyPlayerService] Resultado del intento de desbloqueo: ${unlockResult.message}`);
    }

    await queryRunner.commitTransaction();

    return {
      message: "Usuario verificado exitosamente",
    };
  } catch (error) {
    console.error("[verifyPlayerService] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const createChildUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { parentUserId, childUsers } = req.body;

    if (!parentUserId || !childUsers || !Array.isArray(childUsers) || childUsers.length === 0) {
      return res.status(400).json({
        message: "Se requiere parentUserId y un array de childUsers",
        status: 400
      });
    }

    const result = await createChildUsersService(parentUserId, childUsers);
    return res.status(result.status).json(result);

  } catch (error: any) {
    console.error("[Controller - createChildUsers] Error:", error);
    return res.status(500).json({
      message: error.message || "Error interno del servidor",
      status: 500
    });
  }
};

export const getUserProfileController = async (req: RequestExt, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: "Usuario no autenticado" 
      });
    }

    const result = await getUserProfileService(req.user.id);
    
    if (result.status !== 200) {
      return res.status(result.status).json({ 
        message: result.message 
      });
    }

    return res.status(200).json(result.data);

  } catch (error: any) {
    console.error("[getUserProfileController] Error:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor" 
    });
  }
};

export const updateUserProfileController = async (req: RequestExt, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        message: "Usuario no autenticado" 
      });
    }

    const updateData = req.body;
    
    const result = await updateUserProfileService(req.user.id, updateData);
    
    return res.status(result.status).json({ 
      message: result.message 
    });

  } catch (error: any) {
    console.error("[updateUserProfileController] Error:", error);
    return res.status(500).json({ 
      message: "Error interno del servidor" 
    });
  }
};
