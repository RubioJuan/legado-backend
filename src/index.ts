import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/db";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source has been initialized!");

    // Si quieres crear tablas o insertar datos por defecto:
    // await addTypesByDefault();
    // await addFirstBoard();

    console.log("✅ Table creation with synchronize should be completed!");

    const port = parseInt(process.env.PORT || '3000', 10);

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${port}`);
    });

  } catch (error) {
    console.error("❌ Error during server startup:", error);
  }
}

main();
