const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const { router: authRouter } = require('./auth');
const diagRouter = require('./diagnosticos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/diagnosticos', diagRouter);

app.use(express.static(path.join(__dirname, '..')));

app.use((req, res) => {
    res.redirect('/login.html');
});

async function migrateDB() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM diagnosticos LIKE 'data_json'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE diagnosticos ADD COLUMN data_json JSON");
        }
    } catch (e) { /* table may not exist yet */ }
}

migrateDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
});
