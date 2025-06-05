import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/db";

async function main() {
  try {
    await AppDataSource.initialize()
      .then(() => {
        console.log("Data Source has been initialized!");
      })
      .then(async () => {
        // ⬅️ COMENTADO TEMPORALMENTE PARA CREAR TABLAS PRIMERO
        // await addTypesByDefault();
        // await addFirstBoard();
        console.log("Table creation with synchronize should be completed!");
      })
      .catch((err) => {
        console.error("Error during Data Source initialization", err);
      });

    const port = parseInt(process.env.PORT || '8000', 10); // ⬅️ VOLVER A PUERTO 8000
    app.listen(port, '0.0.0.0', () => { // ⬅️ Escuchar en todas las interfaces
            console.log(`Server run on port ${port}`);
    });

  } catch (error) {
    console.error(error);
  }
}

main();
