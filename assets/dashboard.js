document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth and load user info
    const token = getToken();
    if (!token) return;

    try {
        const userRes = await fetchWithAuth('/api/auth/me');
        const user = await userRes.json();
        document.getElementById('userName').innerHTML = `👤 ${user.name}`;
        
        loadDiagnostics();
    } catch (e) {
        console.error(e);
    }
});

async function loadDiagnostics() {
    const list = document.getElementById('diagsList');
    try {
        const res = await fetchWithAuth('/api/diagnosticos');
        const data = await res.json();
        
        if (data.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum diagnóstico encontrado</h3>
                    <p>Você ainda não criou nenhum diagnóstico.</p>
                    <a href="diagnostico.html" class="btn-new">Criar o primeiro</a>
                </div>
            `;
            return;
        }

        let html = '';
        data.forEach(d => {
            const date = new Date(d.updated_at).toLocaleDateString('pt-BR');
            html += `
                <div class="diag-card">
                    <div class="diag-info">
                        <h3>${esc(d.nome) || 'Empresa Sem Nome'}</h3>
                        <div class="diag-meta">
                            <span>🏢 ${esc(d.segmento) || 'Sem segmento'}</span>
                            <span>📅 Atualizado em ${date}</span>
                        </div>
                    </div>
                    <div class="diag-actions">
                        <a href="diagnostico.html?id=${d.id}" class="btn-action btn-edit">Continuar / Editar</a>
                        <button onclick="deleteDiag(${d.id})" class="btn-action btn-del">Excluir</button>
                    </div>
                </div>
            `;
        });
        list.innerHTML = html;
    } catch (e) {
        list.innerHTML = `<div class="empty-state">Erro ao carregar diagnósticos.</div>`;
    }
}

async function deleteDiag(id) {
    if(!confirm('Tem certeza que deseja excluir este diagnóstico?')) return;
    try {
        const res = await fetchWithAuth(`/api/diagnosticos/${id}`, { method: 'DELETE' });
        if(res.ok) {
            loadDiagnostics();
        } else {
            alert('Erro ao excluir');
        }
    } catch(e) {
        alert('Erro ao excluir');
    }
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
