import { AppDataSource } from "./config/db";
import { EntityUser } from "./entities/user.entity";
import { Not, IsNull } from "typeorm";

async function quickTest() {
  console.log("🚀 Iniciando test...");
  
  try {
    console.log("📡 Intentando conectar a la base de datos...");
    await AppDataSource.initialize();
    console.log("✅ Conexión establecida!");

    // Buscar algunos usuarios con rol dual
    console.log("🔍 Buscando usuarios con rol dual...");
    const dualRoleUsers = await AppDataSource.manager.find(EntityUser, {
      where: {
        secondaryBoardIdAsRecruit: Not(IsNull())
      },
      select: ["id", "username", "idUserProcessState", "secondaryBoardIdAsRecruit", "secondaryPositionAsRecruit"],
      take: 10
    });

    console.log(`📊 Encontrados ${dualRoleUsers.length} usuarios con rol dual:`);
    
    for (const user of dualRoleUsers) {
      console.log(`👤 ${user.username} - Estado: ${user.idUserProcessState} - Board: ${user.secondaryBoardIdAsRecruit}`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Conexión cerrada");
    }
  }
}

quickTest(); 