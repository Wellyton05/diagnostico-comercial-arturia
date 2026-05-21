const express = require('express');
const db = require('./db');
const { verifyToken } = require('./auth');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nome, cnpj, segmento, cidade, data_json, created_at, updated_at FROM diagnosticos WHERE user_id = ? ORDER BY updated_at DESC',
            [req.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar diagnósticos' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const { nome, cnpj, segmento, cidade, data_json } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO diagnosticos (user_id, nome, cnpj, segmento, cidade, data_json) VALUES (?, ?, ?, ?, ?, ?)',
            [req.userId, nome || '', cnpj || '', segmento || '', cidade || '', JSON.stringify(data_json)]
        );
        res.json({ id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar diagnóstico' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    const { nome, cnpj, segmento, cidade, data_json } = req.body;
    try {
        const [check] = await db.query('SELECT id FROM diagnosticos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (check.length === 0) return res.status(404).json({ error: 'Não encontrado' });
        await db.query(
            'UPDATE diagnosticos SET nome=?, cnpj=?, segmento=?, cidade=?, data_json=? WHERE id=?',
            [nome || '', cnpj || '', segmento || '', cidade || '', JSON.stringify(data_json), req.params.id]
        );
        res.json({ message: 'Atualizado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM diagnosticos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM diagnosticos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ message: 'Excluído' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir' });
    }
});

module.exports = router;
