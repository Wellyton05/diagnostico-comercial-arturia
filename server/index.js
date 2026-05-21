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
const db = require('./db');

async function migrateDB() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM diagnosticos LIKE 'data_json'");
        if (columns.length === 0) {
            console.log("Migrando banco de dados: Adicionando coluna data_json...");
            await db.query("ALTER TABLE diagnosticos ADD COLUMN data_json JSON");
            console.log("Migração concluída com sucesso.");
        }
    } catch (e) {
        console.error("Erro na migração do banco:", e);
    }
}

app.listen(PORT, async () => {
    await migrateDB();
    console.log(`Servidor rodando na porta ${PORT}`);
});
