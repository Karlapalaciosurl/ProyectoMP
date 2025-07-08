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
      res.json({ success: true, message: "Login correcto", usuario: result.recordset[0]});
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

    const expedientes = result.recordset.map(exp => ({
      ...exp,
      estado: exp.estado === 2 ? "Pendiente" :
              exp.estado === 0 ? "Rechazado" : exp.estado
    }));

    res.json(expedientes);
  } catch (err) {
    console.error("Error al obtener expedientes:", err);
    res.status(500).json({ message: "Error al obtener expedientes" });
  } finally {
    await sql.close();
  }
});

//Insertar
app.post("/api/expedientes", async (req, res) => {
  const { numero_expediente, tipo_delito, id_usuario_tecnico } = req.body;

  if (!numero_expediente || !tipo_delito || !id_usuario_tecnico) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      EXEC sp_InsertarExpediente
        @numero_expediente = ${numero_expediente},
        @tipo_delito = ${tipo_delito},
        @id_usuario_tecnico = ${id_usuario_tecnico}
    `;

    res.json({ success: true, message: result.recordset[0]?.Mensaje || "Expediente insertado" });
  } catch (err) {
    console.error("Error al insertar expediente:", err);
    res.status(500).json({ message: "Error al insertar expediente" });
  } finally {
    await sql.close();
  }
});
//actualizar 
app.post("/api/expedientes/actualizar", async (req, res) => {
  const { id_expediente, estado, justificacion, id_usuario_coordinador } = req.body;

  if (!id_expediente || estado === undefined || !id_usuario_coordinador) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    await sql.connect(dbConfig);

    const result = await sql.query`
      EXEC sp_ActualizarExpedienteCoordinador
        @id_expediente = ${id_expediente},
        @estado = ${estado},
        @justificacion = ${justificacion || null},
        @id_usuario_coordinador = ${id_usuario_coordinador}
    `;

    res.json({ success: true, message: result.recordset[0]?.Mensaje || "Expediente actualizado" });
  } catch (err) {
    console.error("Error al actualizar expediente:", err);
    res.status(500).json({ message: "Error al actualizar expediente" });
  } finally {
    await sql.close();
  }
});





// PUERTO
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Prueba de Backend responde en http://localhost:${PORT}`);
});
