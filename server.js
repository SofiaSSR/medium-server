const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para cualquier origen
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware para parsear JSON
app.use(express.json());

// Ruta para obtener transacciones desde el servicio externo

app.use("/api", async (req, res) => {
  try {
    const targetPath = req.header("X-Target-Path");

    if (!targetPath || typeof targetPath !== "string") {
      return res.status(400).json({ message: "Missing Target Path " });
    }

    const targetUrl = `http://ec2-35-90-236-177.us-west-2.compute.amazonaws.com:3000${targetPath}`;
    console.log("Proxying request to:", targetUrl);

    if (targetPath.includes("date-range") || targetPath.includes("filter-mixed") ) {
      console.log("Handling date range or filter mixed request", req.body.query, req.body.data);
      const period = req.body?.data?.period;
      const end_date = new Date();
      let start_date;
      if (!period) {
        return res.status(400).json({
          message: "Missing period query parameter",
        });
      }
      if (period === "fortnight")
        start_date = new Date(
          end_date.getFullYear(),
          end_date.getMonth(),
          end_date.getDate() - 15
        );
      if (period === "month")
        start_date = new Date(
          end_date.getFullYear(),
          end_date.getMonth() - 1,
          end_date.getDate()
        );
      const response = await axios.get(targetUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        params: req.params,
        query: { end_date, start_date, date_field: "created_at" , ...req.body.query },
      });
    res.status(response.status).send(response.data);
    return
    }

    const response = await axios.get(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
      params: req.params,
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(500).json({
      message: "Proxy GET failed",
      error: error.message,
    });
  }
});

// Ruta de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running correctly",
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.status(200).json({
    message: "API is working correctly",
    version: "1.0.0",
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
