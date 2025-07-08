const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const dbConfig = {
  user: "UsuarioMP",
  password: "Admon456",
  server: "192.168.5.67",
  database: "DB_DICRI",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// LOGIN
app.post("/api/login", async (req, res) => {
  const { nombre_usuario, contrasena } = req.body;

  if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      SELECT * FROM DB_Usuarios 
      WHERE nombre_usuario = ${nombre_usuario} AND contrasena = ${contrasena}`;

    if (result.recordset.length > 0) {
      res.json({ success: true, message: "Login correcto" });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error en el servidor" });
  } finally {
    await sql.close();
  }
});

// OBTENER EXPEDIENTES
app.get("/api/expedientes", async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query(`EXEC sp_ObtenerExpedientes_pendientes_rechazados`);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).json({ message: "Error al obtener expedientes" });
  } finally {
    await sql.close();
  }
});

// PUERTO
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Prueba de Backend responde en http://localhost:${PORT}`);
});
