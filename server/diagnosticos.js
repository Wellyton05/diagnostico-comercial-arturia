const express = require('express');
const db = require('./db');
const { verifyToken } = require('./auth');
const router = express.Router();

// Get all diagnostics for the logged in user
router.get('/', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, nome, cnpj, segmento, data_diag, updated_at FROM diagnosticos WHERE user_id = ? ORDER BY updated_at DESC',
            [req.userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar diagnósticos' });
    }
});

// Create a new diagnostic
router.post('/', verifyToken, async (req, res) => {
    const { empresa, respostas, obs } = req.body;
    const e = empresa || {};
    try {
        const [result] = await db.query(
            `INSERT INTO diagnosticos 
            (user_id, nome, cnpj, segmento, cidade, data_diag, consultor, participantes, erp, faturamento, vendedores, clientes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.userId, e.nome, e.cnpj, e.segmento, e.cidade, e.data, e.consultor, e.participantes, e.erp, e.faturamento, e.vendedores, e.clientes]
        );
        
        const diagId = result.insertId;

        // Save answers
        await saveAnswers(diagId, respostas, obs);

        res.json({ id: diagId, message: 'Criado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar diagnóstico' });
    }
});

// Update an existing diagnostic
router.put('/:id', verifyToken, async (req, res) => {
    const diagId = req.params.id;
    const { empresa, respostas, obs } = req.body;
    const e = empresa || {};
    try {
        // verify ownership
        const [check] = await db.query('SELECT id FROM diagnosticos WHERE id = ? AND user_id = ?', [diagId, req.userId]);
        if (check.length === 0) return res.status(404).json({ error: 'Diagnóstico não encontrado' });

        await db.query(
            `UPDATE diagnosticos SET 
            nome=?, cnpj=?, segmento=?, cidade=?, data_diag=?, consultor=?, participantes=?, erp=?, faturamento=?, vendedores=?, clientes=?
            WHERE id = ?`,
            [e.nome, e.cnpj, e.segmento, e.cidade, e.data, e.consultor, e.participantes, e.erp, e.faturamento, e.vendedores, e.clientes, diagId]
        );

        await saveAnswers(diagId, respostas, obs);

        res.json({ message: 'Atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar diagnóstico' });
    }
});

// Get a single diagnostic
router.get('/:id', verifyToken, async (req, res) => {
    const diagId = req.params.id;
    try {
        const [diags] = await db.query('SELECT * FROM diagnosticos WHERE id = ? AND user_id = ?', [diagId, req.userId]);
        if (diags.length === 0) return res.status(404).json({ error: 'Diagnóstico não encontrado' });
        
        const diag = diags[0];
        
        const [ans] = await db.query('SELECT question_id, valor, observacao FROM respostas WHERE diagnostico_id = ?', [diagId]);
        
        const respostas = {};
        const obs = {};
        ans.forEach(row => {
            respostas[row.question_id] = row.valor;
            if (row.observacao) obs[row.question_id] = row.observacao;
        });

        res.json({
            empresa: {
                nome: diag.nome || '',
                cnpj: diag.cnpj || '',
                segmento: diag.segmento || '',
                cidade: diag.cidade || '',
                data: diag.data_diag || '',
                consultor: diag.consultor || '',
                participantes: diag.participantes || '',
                erp: diag.erp || '',
                faturamento: diag.faturamento || '',
                vendedores: diag.vendedores || '',
                clientes: diag.clientes || ''
            },
            respostas,
            obs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar diagnóstico' });
    }
});

// Delete a diagnostic
router.delete('/:id', verifyToken, async (req, res) => {
    const diagId = req.params.id;
    try {
        const [result] = await db.query('DELETE FROM diagnosticos WHERE id = ? AND user_id = ?', [diagId, req.userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Diagnóstico não encontrado' });
        res.json({ message: 'Excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir diagnóstico' });
    }
});

async function saveAnswers(diagId, respostas, obs) {
    if (!respostas) return;
    
    // Get existing to decide insert/update (or we can just use INSERT ON DUPLICATE KEY UPDATE)
    for (const qId of Object.keys(respostas)) {
        const val = respostas[qId];
        const observacao = obs && obs[qId] ? obs[qId] : '';
        
        const jsonVal = JSON.stringify(val);
        
        await db.query(
            `INSERT INTO respostas (diagnostico_id, question_id, valor, observacao) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE valor = VALUES(valor), observacao = VALUES(observacao)`,
            [diagId, qId, jsonVal, observacao]
        );
    }
}

module.exports = router;
