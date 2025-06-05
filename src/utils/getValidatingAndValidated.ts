export const getDefendersValidatingAndValidated = (board: any) => {
  try {
    let countValidated = 0;
    let countValidating = 0;

    if (board.idDefender1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender3?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender3?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender4?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender4?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender5?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender5?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender6?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender6?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender7?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender7?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender8?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender8?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }

    const response = { validating: countValidating, validated: countValidated };

    return response;
  } catch (error) {
    console.error(error);
    return null;
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
  }
};

export const getOtherUsersValidatingAndValidated = (board: any) => {
  try {
    let countValidated = 0;
    let countValidating = 0;

    if (board.idCreator1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idCreator1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idCreator2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idCreator2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator3?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator3?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator4?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator4?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }

    const response = { validating: countValidating, validated: countValidated };

    return response;
  } catch (error) {
    console.error(error);
    return null;
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
  }
};

export const getUsersValidatingAndValidated = (board: any) => {
  try {
    let countValidated = 0;
    let countValidating = 0;

    if (board.idCreator1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idCreator1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idCreator2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idCreator2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator3?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator3?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idGenerator4?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idGenerator4?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender1?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender1?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender2?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender2?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender3?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender3?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender4?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender4?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender5?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender5?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender6?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender6?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender7?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender7?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }
    if (board.idDefender8?.idUserProcessState.id === 3) {
      countValidating = countValidating + 1;
    }
    if (board.idDefender8?.idUserProcessState.id === 4) {
      countValidated = countValidated + 1;
    }

    const response = { validating: countValidating, validated: countValidated };

    return response;
  } catch (error) {
    console.error(error);
    return null;
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
  }
};
