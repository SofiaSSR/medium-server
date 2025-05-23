const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para cualquier origen
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Ruta para obtener transacciones desde el servicio externo
app.get('/api/transactions', async (req, res) => {
  try {
    const response = await axios.get('http://ec2-35-90-236-177.us-west-2.compute.amazonaws.com:3000/transactions/');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener las transacciones',
      error: error.message
    });
  }
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running correctly'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API is working correctly',
    version: '1.0.0'
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});