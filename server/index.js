const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { router: authRouter } = require('./auth');
const diagRouter = require('./diagnosticos');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/diagnosticos', diagRouter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// Fallback to index.html for unknown routes (SPA like behavior, though we have multiple pages)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
