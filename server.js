const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const baseUrl = `http://ec2-35-90-236-177.us-west-2.compute.amazonaws.com:${PORT}`;
// Habilitar CORS para cualquier origen
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware para parsear JSON
app.use(express.json());

// Ruta para obtener transacciones desde el servicio externo

app.use("/api/transactions", async (req, res) => {
  try {
    const targetPath = req.header("X-Target-Path");

    if (!targetPath || typeof targetPath !== "string") {
      return res.status(400).json({ message: "Missing Target Path " });
    }
    const targetUrl = `${baseUrl}${targetPath}`;

    console.log("Proxying transactions request to:", targetUrl);
    switch (req.header("method")) {
      case "POST":
        const response = axios.post(targetUrl, {
          headers: {
            "Content-Type": "application/json",
          },
          params: req.params,
          ...req.body,
        });
        res.status(response.status).send(response.data);
        return;
      case "PUT":
        return res.status(405).json({ message: "Method Not Allowed" });
      case "DELETE":
        return res.status(405).json({ message: "Method Not Allowed" });
      case "PATCH":
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    if (
      targetPath.includes("date-range") ||
      targetPath.includes("filter-mixed")
    ) {
      const period = req.body?.data?.period;

      if (!period) {
        return res.status(400).json({
          message: "Missing period query parameter",
        });
      }
      let { end_date, start_date } = getDateRange(period);
      console.log(
        "Handling date range or filter mixed request",
        {
          end_date,
          start_date,
          ...req.body?.query,
        },
        req.body.data
      );
      const response = await axios.get(targetUrl, {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          ...req.params,
          start_date,
          end_date,
          ...req.body?.query,
        },
      });
      res.status(response.status).send(response.data);
      return;
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
    res.status(error.status).json({
      message: "Proxy GET failed",
      error: error.message,
      error: error.response ? error.response.data : "No response data",
    });
  }
});

function getDateRange(period) {
  const end_date = new Date();
  let start_date;
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
  if (period === "all") start_date = new Date(0);
  return {
    end_date,
    start_date,
  };
}


app.use("/api/users", async (req, res) => {
  try {
    const targetPath = req.header("X-Target-Path");

    if (!targetPath || typeof targetPath !== "string") {
      return res.status(400).json({ message: "Missing Target Path " });
    }

    const targetUrl = `${baseUrl}${targetPath}`;
    console.log("Proxying users request to:", targetUrl);
    // Verificar el método HTTP
    switch (req.header("method")) {
      case "POST":
        const response = await axios.post(targetUrl, {
          ...req.params,
          ...req.body,
        });

        res.status(response.status).send(response.data);
        return;
      case "PUT":
        return res.status(405).json({ message: "Method Not Allowed" });
      case "DELETE":
        return res.status(405).json({ message: "Method Not Allowed" });
      case "PATCH":
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const response = await axios.get(
      targetUrl,
      {
        params: req.params,
        ...req.body,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );


    res.status(response.status).send(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res.status(error.status).json({
      message: "Proxy POST failed",
      error: error.message,
      error: error.response ? error.response.data : "No response data",
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
