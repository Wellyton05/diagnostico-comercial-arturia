// ─── DADOS ─────────────────────────────────────────────────────────────────
var ST = {
  empresa:{nome:'',cnpj:'',segmento:'',cidade:'',data:'',consultor:'',participantes:'',erp:'',faturamento:'',vendedores:'',clientes:''},
  respostas:{},
  obs:{}
};

var STEPS = [
  {
    id:'empresa', title:'Identificação da Empresa',
    icon:'🏢', desc:'Dados básicos para identificação do diagnóstico.',
    fields:[
      {id:'nome',label:'Razão Social / Nome da Empresa',type:'text',ph:'Ex: Indústria Exemplo S.A.',required:true},
      {id:'cnpj',label:'CNPJ',type:'text',ph:'00.000.000/0001-00'},
      {id:'segmento',label:'Setor / Segmento de Atuação',type:'text',ph:'Ex: Alimentos, Têxtil, Distribuição...'},
      {id:'cidade',label:'Cidade / Estado',type:'text',ph:'Ex: São Paulo / SP'},
      {id:'data',label:'Data do Diagnóstico',type:'text',ph:''},
      {id:'consultor',label:'Consultor Responsável',type:'text',ph:'Seu nome'},
      {id:'participantes',label:'Participantes da Reunião',type:'text',ph:'Nomes e cargos'},
      {id:'erp',label:'ERP Utilizado',type:'text',ph:'SAP, TOTVS, Sankhya, Bling...'},
      {id:'faturamento',label:'Faturamento Anual Aproximado',type:'text',ph:'Ex: R$ 12 milhões'},
      {id:'vendedores',label:'Nº de Vendedores / Representantes',type:'text',ph:'Ex: 15'},
      {id:'clientes',label:'Nº de Clientes Ativos',type:'text',ph:'Ex: 850'}
    ]
  },
  {
    id:'bloco0', title:'Clientes', icon:'👥', desc:'Cadastro e gestão da base de clientes.',
    questions:[
      {id:'q00',q:'Quais informações são obrigatórias para cadastrar um novo cliente?',tipo:'multi',opts:['CNPJ','Inscrição Estadual','Razão Social','Nome Fantasia','Endereço completo','Contato principal','E-mail','Telefone','Segmento','Região','Grupo Econômico'],crit:'ALTA'},
      {id:'q01',q:'Quais documentos/anexos são exigidos no cadastro?',tipo:'multi',opts:['Contrato Social','Cartão CNPJ','Inscrição Estadual','Comprovante de Endereço','Referências Comerciais'],crit:'ALTA'},
      {id:'q02',q:'Existe divisão de carteira por vendedor?',tipo:'yn',crit:'ALTA'},
      {id:'q03',q:'Um cliente pode ter mais de um vendedor responsável?',tipo:'yn',crit:'MEDIA'},
      {id:'q04',q:'Existe classificação / segmentação de clientes?',tipo:'yn',crit:'ALTA'},
      {id:'q05',q:'Quais critérios definem a classificação do cliente?',tipo:'multi',opts:['Volume de Compras','Frequência de Compra','Segmento de Mercado','Região','Potencial de Compra','Score de Crédito','Mix de Produtos'],crit:'ALTA'},
      {id:'q06',q:'Existe processo de aprovação para novos cadastros?',tipo:'yn',crit:'MEDIA'},
      {id:'q07',q:'Quem aprova o cadastro de novos clientes?',tipo:'text',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco1', title:'Risco & Crédito', icon:'🛡️', desc:'Análise de crédito e gestão de risco financeiro.',
    questions:[
      {id:'q10',q:'Após quanto tempo sem comprar o cliente precisa de nova análise de crédito?',tipo:'single',opts:['30 dias','60 dias','90 dias','180 dias','1 ano','Não se aplica'],crit:'ALTA'},
      {id:'q11',q:'O vendedor pode emitir pedido para cliente inadimplente com aprovação por alçada?',tipo:'yn',crit:'ALTA'},
      {id:'q12',q:'O vendedor pode emitir pedido para cliente sem limite de crédito com aprovação por alçada?',tipo:'yn',crit:'ALTA'},
      {id:'q13',q:'Quem define o limite de crédito de cada cliente?',tipo:'single',opts:['Departamento Financeiro','Diretoria','Equipe de Vendas','Automatizado pelo ERP','Comitê de Crédito'],crit:'ALTA'},
      {id:'q14',q:'Com qual periodicidade o limite de crédito é revisado?',tipo:'single',opts:['Mensal','Trimestral','Semestral','Anual','Somente sob demanda'],crit:'MEDIA'},
      {id:'q15',q:'O sistema de análise de crédito é integrado ao ERP?',tipo:'yn',crit:'MEDIA'},
      {id:'q16',q:'Existem regras de crédito diferenciadas por segmento ou perfil de cliente?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco2', title:'Frete', icon:'🚚', desc:'Política de frete e logística de entrega.',
    questions:[
      {id:'q20',q:'Qual o valor mínimo de pedido para frete CIF (pago pelo fornecedor)?',tipo:'text',crit:'ALTA',ph:'Ex: R$ 2.000,00'},
      {id:'q21',q:'Qual o percentual de desconto concedido na modalidade FOB?',tipo:'text',crit:'ALTA',ph:'Ex: 3,5%'},
      {id:'q22',q:'Qual o percentual de desconto no redespacho?',tipo:'text',crit:'ALTA',ph:'Ex: 2%'},
      {id:'q23',q:'Existe integração com sistema de cálculo de frete?',tipo:'yn',crit:'MEDIA'},
      {id:'q24',q:'Qual sistema / transportadora é utilizado?',tipo:'text',crit:'MEDIA',ph:'Ex: Intelipost, Melhor Envio, transportadora própria...'},
      {id:'q25',q:'O frete é calculado com base em qual critério principal?',tipo:'multi',opts:['Tabela fixa por região','Peso do pedido','Valor do pedido','Transportadora específica','Distância em km'],crit:'ALTA'},
      {id:'q26',q:'Existem exceções de frete para clientes ou regiões específicas?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco3', title:'Preço', icon:'💲', desc:'Política de precificação e tabelas de preço.',
    questions:[
      {id:'q30',q:'Possui política de preço diferenciada por classificação de cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q31',q:'Existe diferenciação de regras entre representante comercial, vendedor CLT e inside sales?',tipo:'yn',crit:'ALTA'},
      {id:'q32',q:'Quais perfis possuem regras de preço diferentes?',tipo:'multi',opts:['Representante Comercial','Vendedor CLT','Inside Sales','Televendas','Key Account'],crit:'ALTA'},
      {id:'q33',q:'Existe preço mínimo definido por produto?',tipo:'yn',crit:'ALTA'},
      {id:'q34',q:'Existe preço ideal (target) para cálculo de margem e saúde do pedido?',tipo:'yn',crit:'ALTA'},
      {id:'q35',q:'Com qual periodicidade os preços são reajustados?',tipo:'single',opts:['Mensal','Trimestral','Semestral','Anual','Conforme necessidade'],crit:'MEDIA'},
      {id:'q36',q:'As tabelas de preço consideram impostos (ICMS, ST, frete)?',tipo:'yn',crit:'ALTA'},
      {id:'q37',q:'Existe tabela de preço específica por cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q38',q:'Existe tabela de preço por classificação de cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q39',q:'Existe desconto padrão previsto em tabela?',tipo:'yn',crit:'ALTA'},
      {id:'q3a',q:'Quantas tabelas de preço existem atualmente?',tipo:'text',crit:'MEDIA',ph:'Ex: 5 tabelas'},
      {id:'q3b',q:'Como as tabelas de preço são distribuídas aos vendedores?',tipo:'multi',opts:['ERP / Sistema','Excel','PDF impresso','Portal web','WhatsApp','E-mail'],crit:'MEDIA'}
    ]
  },
  {
    id:'bloco4', title:'Condição de Pagamento', icon:'💳', desc:'Prazos, formas e regras de pagamento.',
    questions:[
      {id:'q40',q:'Existe condição de pagamento específica por cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q41',q:'Existe prazo médio de pagamento definido por cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q42',q:'Os vendedores podem escolher livremente as condições de pagamento?',tipo:'yn',crit:'ALTA'},
      {id:'q43',q:'Existe desconto financeiro para alguma condição de pagamento?',tipo:'yn',crit:'ALTA'},
      {id:'q44',q:'Quais condições possuem desconto financeiro? (descreva)',tipo:'text',crit:'MEDIA',ph:'Ex: À vista 5%, 7 dias 3%...'},
      {id:'q45',q:'Quais formas de pagamento são aceitas?',tipo:'multi',opts:['Boleto bancário','PIX','Cartão de crédito','Depósito / TED','Cheque','Crédito em conta','Consignado'],crit:'ALTA'},
      {id:'q46',q:'A condição de pagamento está vinculada ao limite de crédito do cliente?',tipo:'yn',crit:'ALTA'},
      {id:'q47',q:'O sistema bloqueia automaticamente pedidos com condição acima do limite disponível?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco5', title:'Comissão', icon:'💰', desc:'Estrutura e cálculo de comissões da equipe.',
    questions:[
      {id:'q50',q:'Como são calculadas as comissões da equipe comercial?',tipo:'multi',opts:['Sobre faturamento bruto','Sobre recebimento','Sobre margem','Por produto / linha','Mix de produtos','Volume de vendas'],crit:'ALTA'},
      {id:'q51',q:'As comissões são diferenciadas por produto ou linha de produto?',tipo:'yn',crit:'ALTA'},
      {id:'q52',q:'Existe comissão escalonada por volume ou meta atingida?',tipo:'yn',crit:'MEDIA'},
      {id:'q53',q:'Como o relatório de comissões é disponibilizado para os vendedores?',tipo:'multi',opts:['ERP / Sistema','Planilha Excel','PDF','Portal web','WhatsApp','Nenhum relatório atual'],crit:'MEDIA'},
      {id:'q54',q:'Qual a periodicidade de pagamento das comissões?',tipo:'single',opts:['Semanal','Quinzenal','Mensal','Bimestral','Conforme faturamento'],crit:'ALTA'},
      {id:'q55',q:'Existe estrutura de comissão diferente para representantes externos?',tipo:'yn',crit:'MEDIA'},
      {id:'q56',q:'O sistema atual calcula comissões automaticamente?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco6', title:'Estoque', icon:'📦', desc:'Visibilidade e regras de estoque.',
    questions:[
      {id:'q60',q:'Estoques de quais filiais / CDs serão visíveis ao vendedor?',tipo:'multi',opts:['Todas as filiais','Filiais regionais','CD específico','Apenas CD principal'],crit:'ALTA'},
      {id:'q61',q:'Os produtos são vendidos em embalagens com múltiplos (caixas, fardos, paletes)?',tipo:'yn',crit:'ALTA'},
      {id:'q62',q:'É permitida a venda de produto sem estoque mediante aprovação por alçada?',tipo:'yn',crit:'ALTA'},
      {id:'q63',q:'O estoque reservado pelo pedido é atualizado em tempo real no sistema?',tipo:'yn',crit:'MEDIA'},
      {id:'q64',q:'Existem produtos com estoque mínimo configurado?',tipo:'yn',crit:'MEDIA'},
      {id:'q65',q:'O vendedor visualiza o saldo de estoque no momento em que faz o pedido?',tipo:'yn',crit:'ALTA'}
    ]
  },
  {
    id:'bloco7', title:'Bonificação & Cashback', icon:'🎁', desc:'Programas de bonificação e retorno ao cliente.',
    questions:[
      {id:'q70',q:'Existe política de bonificação ou cashback para clientes?',tipo:'yn',crit:'ALTA'},
      {id:'q71',q:'Qual o percentual de venda acima do preço mínimo que gera cashback?',tipo:'text',crit:'ALTA',ph:'Ex: 5% acima do mínimo'},
      {id:'q72',q:'A bonificação é concedida em qual formato?',tipo:'multi',opts:['Produto / mercadoria','Desconto em nota fiscal','Crédito para próxima compra','Transferência financeira'],crit:'ALTA'},
      {id:'q73',q:'Existe verba promocional destinada a clientes estratégicos?',tipo:'yn',crit:'MEDIA'},
      {id:'q74',q:'As bonificações são aprovadas por alçada antes de serem concedidas?',tipo:'yn',crit:'ALTA'},
      {id:'q75',q:'Como as bonificações são registradas / controladas atualmente?',tipo:'multi',opts:['ERP / Sistema','Planilha Excel','Controle manual','Sistema próprio','Não há controle'],crit:'MEDIA'}
    ]
  },
  {
    id:'bloco8', title:'Promoções & Campanhas', icon:'🎯', desc:'Campanhas comerciais e promoções especiais.',
    questions:[
      {id:'q80',q:'Existem campanhas com preços exclusivos por período determinado?',tipo:'yn',crit:'ALTA'},
      {id:'q81',q:'Como as promoções são controladas e comunicadas atualmente?',tipo:'multi',opts:['ERP / Sistema','Planilha Excel','WhatsApp','Sistema próprio','Sem controle formal'],crit:'ALTA'},
      {id:'q82',q:'As promoções respeitam o preço mínimo estabelecido por produto?',tipo:'yn',crit:'ALTA'},
      {id:'q83',q:'Quem aprova o lançamento de uma campanha promocional?',tipo:'text',crit:'ALTA',ph:'Ex: Gerente Comercial, Diretor...'},
      {id:'q84',q:'As promoções são segmentadas por tipo ou perfil de cliente?',tipo:'yn',crit:'MEDIA'},
      {id:'q85',q:'Existe calendário comercial de campanhas e promoções?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco9', title:'Motivos de Não Venda', icon:'📊', desc:'Registro e análise de oportunidades perdidas.',
    questions:[
      {id:'q90',q:'Quais são os possíveis motivos de não venda registrados?',tipo:'multi',opts:['Preço acima do mercado','Concorrência','Falta de estoque','Crédito bloqueado','Frete elevado','Prazo de entrega longo','Produto inadequado','Problema de entrega','Relacionamento / atendimento'],crit:'ALTA'},
      {id:'q91',q:'Os motivos de não venda são registrados pelo vendedor no sistema?',tipo:'yn',crit:'ALTA'},
      {id:'q92',q:'A gestão analisa periodicamente os motivos de não venda?',tipo:'yn',crit:'MEDIA'},
      {id:'q93',q:'O registro de motivo de não venda é obrigatório para fechar uma visita/contato?',tipo:'yn',crit:'MEDIA'}
    ]
  },
  {
    id:'bloco10', title:'Fluxo de Aprovações', icon:'✅', desc:'Processo de aprovação por alçada.',
    questions:[
      {id:'qa0',q:'Existem níveis diferentes de alçada de aprovação?',tipo:'yn',crit:'ALTA'},
      {id:'qa1',q:'Quem são os responsáveis pelas aprovações comerciais? (nome e cargo)',tipo:'text',crit:'ALTA',ph:'Ex: João Silva — Gerente Comercial'},
      {id:'qa2',q:'Quem são os responsáveis pelas aprovações financeiras? (nome e cargo)',tipo:'text',crit:'ALTA',ph:'Ex: Maria Santos — Diretora Financeira'},
      {id:'qa3',q:'Quem aprova condições comerciais especiais?',tipo:'text',crit:'ALTA',ph:'Ex: Diretor Comercial'},
      {id:'qa4',q:'O processo de aprovação é manual ou automatizado?',tipo:'single',opts:['100% Manual','Parcialmente automatizado','100% Automatizado'],crit:'ALTA'},
      {id:'qa5',q:'Quais setores participam do fluxo de aprovação?',tipo:'multi',opts:['Comercial','Financeiro','Diretoria','Estoque / Logística','Jurídico'],crit:'ALTA'},
      {id:'qa6',q:'O aprovador recebe alerta automático (e-mail, WhatsApp, aplicativo)?',tipo:'yn',crit:'MEDIA'},
      {id:'qa7',q:'Existe prazo máximo para aprovação antes de o pedido expirar?',tipo:'yn',crit:'MEDIA'},
      {id:'qa8',q:'Descreva como funciona o fluxo de aprovação por alçada hoje:',tipo:'textarea',crit:'ALTA',ph:'Descreva o processo atual, desde a solicitação até a aprovação final...'}
    ]
  }
];

// ─── ESTADO ─────────────────────────────────────────────────────────────────
var currentStep = 0;
var totalSteps = STEPS.length;
var dbId = null;
var saveTimeout = null;

// ─── UTILS ──────────────────────────────────────────────────────────────────
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function isAnswered(id){
  var v = ST.respostas[id];
  if(v === undefined || v === null || v === '') return false;
  if(Array.isArray(v)) return v.length > 0;
  return true;
}
function getStepProgress(step){
  var s = STEPS[step];
  if(s.fields) return 1;
  var qs = s.questions;
  if(!qs) return 1;
  var ans = qs.filter(function(q){ return isAnswered(q.id); }).length;
  return ans / qs.length;
}
function totalAnswered(){
  var total = 0, ans = 0;
  STEPS.forEach(function(s){
    if(s.questions){ total += s.questions.length; s.questions.forEach(function(q){ if(isAnswered(q.id)) ans++; }); }
  });
  return {total:total, ans:ans, pct:total>0?Math.round(ans/total*100):0};
}
function showToast(msg, type){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type||'success');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(function(){ t.classList.remove('show'); }, 3000);
}

// ─── RENDER PRINCIPAL ────────────────────────────────────────────────────────
async function init(){
  if(typeof getToken === 'function' && !getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  
  if(id) {
    try {
      const res = await fetchWithAuth('/api/diagnosticos/' + id);
      const data = await res.json();
      if(res.ok) {
        dbId = id;
        Object.assign(ST.empresa, data.empresa);
        ST.respostas = data.respostas || {};
        ST.obs = data.obs || {};
      }
    } catch(e) {
      console.error(e);
      showToast('Erro ao carregar diagnóstico', 'error');
    }
  }

  if(!ST.empresa.data) ST.empresa.data = new Date().toLocaleDateString('pt-BR');
  renderApp();
}

async function autoSave() {
  if(typeof getToken === 'function' && !getToken()) return;
  
  const payload = { empresa: ST.empresa, respostas: ST.respostas, obs: ST.obs };
  
  try {
    let res;
    if(dbId) {
      res = await fetchWithAuth('/api/diagnosticos/' + dbId, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      res = await fetchWithAuth('/api/diagnosticos', { method: 'POST', body: JSON.stringify(payload) });
    }
    
    if(res && res.ok) {
      const data = await res.json();
      if(!dbId && data.id) {
        dbId = data.id;
        window.history.replaceState(null, '', '?id=' + dbId);
      }
      showToast('Progresso salvo');
    }
  } catch(e) {
    console.error(e);
  }
}

function triggerAutoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(autoSave, 2000);
}

function renderApp(){
  renderSidebar();
  renderStep();
  renderProgress();
}

function renderSidebar(){
  var nav = document.getElementById('navList');
  nav.innerHTML = '';
  STEPS.forEach(function(s, i){
    var pct = getStepProgress(i);
    var done = s.fields ? Object.keys(ST.empresa).some(function(k){ return ST.empresa[k]; }) : (s.questions && s.questions.filter(function(q){ return isAnswered(q.id); }).length === s.questions.length);
    var partial = !done && pct > 0;
    var active = i === currentStep;
    var li = document.createElement('div');
    li.className = 'nav-item' + (active?' active':'') + (done?' done':'') + (partial?' partial':'');
    li.onclick = (function(idx){ return function(){ goTo(idx); }; })(i);
    li.innerHTML =
      '<div class="nav-icon">' + s.icon + '</div>' +
      '<div class="nav-info"><div class="nav-title">' + esc(s.title) + '</div>' +
        (s.questions ? '<div class="nav-count">' +
          s.questions.filter(function(q){ return isAnswered(q.id); }).length + '/' + s.questions.length +
        '</div>' : '') +
      '</div>' +
      (done ? '<div class="nav-check">✓</div>' : (partial ? '<div class="nav-dot"></div>' : ''));
    nav.appendChild(li);
  });
}

function renderProgress(){
  var p = totalAnswered();
  var pf = document.getElementById('globalProgress');
  var pl = document.getElementById('globalProgressLabel');
  if(pf) pf.style.width = p.pct + '%';
  if(pl) pl.textContent = p.pct + '% concluído — ' + p.ans + '/' + p.total + ' perguntas';
}

function renderStep(){
  var s = STEPS[currentStep];
  var main = document.getElementById('stepContent');

  var isLast = currentStep === totalSteps - 1;
  var stepNum = currentStep + 1;

  var html = '<div class="step-view">';

  // Header
  html += '<div class="step-header">';
  html += '<div class="step-num">' + stepNum + ' / ' + totalSteps + '</div>';
  html += '<div class="step-icon-big">' + s.icon + '</div>';
  html += '<div class="step-title">' + esc(s.title) + '</div>';
  html += '<div class="step-desc">' + esc(s.desc) + '</div>';
  html += '</div>';

  // Fields
  if(s.fields){
    html += '<div class="fields-grid">';
    s.fields.forEach(function(f){
      var val = ST.empresa[f.id] || '';
      var span = (f.id==='participantes'||f.id==='nome') ? 'full' : '';
      html += '<div class="field-group ' + span + '">';
      html += '<label class="field-label">' + esc(f.label) + (f.required ? '<span class="req">*</span>' : '') + '</label>';
      html += '<input type="text" class="field-input" value="' + esc(val) + '" placeholder="' + esc(f.ph||'') + '" oninput="ST.empresa[\'' + f.id + '\']=this.value;renderSidebar();renderProgress();triggerAutoSave()" />';
      html += '</div>';
    });
    html += '</div>';
  }

  // Questions
  if(s.questions){
    html += '<div class="questions-list">';
    s.questions.forEach(function(q, qi){
      var val = ST.respostas[q.id];
      var obs = ST.obs[q.id] || '';
      var answered = isAnswered(q.id);
      var isAlta = q.crit === 'ALTA';

      html += '<div class="q-card' + (answered?' answered':'') + (isAlta?' critical':'') + '" id="qcard-' + q.id + '">';
      html += '<div class="q-header">';
      html += '<div class="q-num">' + (qi+1) + '</div>';
      html += '<div class="q-body">';
      html += '<div class="q-text">' + esc(q.q) + '</div>';
      html += '<div class="q-tags">';
      if(isAlta) html += '<span class="tag tag-alta">● Alta Criticidade</span>';
      html += '<span class="tag tag-tipo">' + tipoBadge(q.tipo) + '</span>';
      html += '</div>';
      html += '</div>';
      if(answered) html += '<div class="q-done">✓</div>';
      html += '</div>';

      html += '<div class="q-input-area">';

      if(q.tipo === 'yn'){
        var y = val==='Sim', n = val==='Não';
        html += '<div class="yn-group">';
        html += '<button class="yn-btn sim' + (y?' active':'') + '" onclick="setR(\'' + q.id + '\',\'Sim\')"><span>✓</span> Sim</button>';
        html += '<button class="yn-btn nao' + (n?' active':'') + '" onclick="setR(\'' + q.id + '\',\'Não\')"><span>✕</span> Não</button>';
        html += '</div>';
      } else if(q.tipo === 'single'){
        html += '<div class="chips-group">';
        q.opts.forEach(function(o){
          html += '<button class="chip' + (val===o?' sel':'') + '" onclick="setR(\'' + q.id + '\',\'' + esc(o) + '\')">' + esc(o) + '</button>';
        });
        html += '</div>';
      } else if(q.tipo === 'multi'){
        var sel = Array.isArray(val) ? val : [];
        html += '<div class="chips-group">';
        q.opts.forEach(function(o){
          html += '<button class="chip multi' + (sel.indexOf(o)>=0?' sel':'') + '" onclick="toggleM(\'' + q.id + '\',\'' + esc(o) + '\')">' + esc(o) + '</button>';
        });
        html += '</div>';
      } else if(q.tipo === 'text'){
        html += '<input type="text" class="q-input" value="' + esc(val||'') + '" placeholder="' + esc(q.ph||'Digite aqui...') + '" oninput="setR(\'' + q.id + '\',this.value)" />';
      } else if(q.tipo === 'textarea'){
        html += '<textarea class="q-textarea" placeholder="' + esc(q.ph||'Descreva aqui...') + '" oninput="setR(\'' + q.id + '\',this.value)">' + esc(val||'') + '</textarea>';
      }

      // Observação
      html += '<div class="obs-row">';
      html += '<span class="obs-icon">📝</span>';
      html += '<input type="text" class="obs-input" value="' + esc(obs) + '" placeholder="Observação, exceção ou contexto adicional..." oninput="ST.obs[\'' + q.id + '\']=this.value;triggerAutoSave()" />';
      html += '</div>';

      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Nav buttons
  html += '<div class="step-nav">';
  if(currentStep > 0){
    html += '<button class="btn btn-back" onclick="goTo(' + (currentStep-1) + ')">← Anterior</button>';
  } else {
    html += '<div></div>';
  }
  if(!isLast){
    html += '<button class="btn btn-next" onclick="goTo(' + (currentStep+1) + ')">Próxima Etapa →</button>';
  } else {
    html += '<button class="btn btn-finish" onclick="showFinish()">🎉 Ver Resumo & Gerar Documento</button>';
  }
  html += '</div>';

  html += '</div>';
  main.innerHTML = html;
  main.scrollTop = 0;
}

function tipoBadge(tipo){
  var m = {yn:'Sim / Não',single:'Seleção Única',multi:'Múltipla Escolha',text:'Texto Livre',textarea:'Texto Livre'};
  return m[tipo] || tipo;
}

// ─── STATE ───────────────────────────────────────────────────────────────────
function setR(id, val){
  ST.respostas[id] = val;
  refreshCard(id);
  renderSidebar();
  renderProgress();
  triggerAutoSave();
}
function toggleM(id, opt){
  var sel = Array.isArray(ST.respostas[id]) ? ST.respostas[id].slice() : [];
  var i = sel.indexOf(opt);
  if(i >= 0) sel.splice(i, 1); else sel.push(opt);
  ST.respostas[id] = sel;
  refreshCard(id);
  renderSidebar();
  renderProgress();
  triggerAutoSave();
}
function refreshCard(id){
  var card = document.getElementById('qcard-' + id);
  if(!card) return;
  card.classList.toggle('answered', isAnswered(id));
  var step = STEPS[currentStep];
  if(step && step.questions){
    var q = step.questions.find(function(x){ return x.id===id; });
    if(q){
      var inputArea = card.querySelector('.q-input-area');
      if(inputArea){
        var val = ST.respostas[id];
        var obs = ST.obs[id] || '';
        var innerHtml = '';
        if(q.tipo === 'yn'){
          var y=val==='Sim', n=val==='Não';
          innerHtml += '<div class="yn-group">';
          innerHtml += '<button class="yn-btn sim' + (y?' active':'') + '" onclick="setR(\'' + q.id + '\',\'Sim\')"><span>✓</span> Sim</button>';
          innerHtml += '<button class="yn-btn nao' + (n?' active':'') + '" onclick="setR(\'' + q.id + '\',\'Não\')"><span>✕</span> Não</button>';
          innerHtml += '</div>';
        } else if(q.tipo === 'single'){
          innerHtml += '<div class="chips-group">';
          q.opts.forEach(function(o){ innerHtml += '<button class="chip' + (val===o?' sel':'') + '" onclick="setR(\'' + q.id + '\',\'' + esc(o) + '\')">' + esc(o) + '</button>'; });
          innerHtml += '</div>';
        } else if(q.tipo === 'multi'){
          var sel = Array.isArray(val) ? val : [];
          innerHtml += '<div class="chips-group">';
          q.opts.forEach(function(o){ innerHtml += '<button class="chip multi' + (sel.indexOf(o)>=0?' sel':'') + '" onclick="toggleM(\'' + q.id + '\',\'' + esc(o) + '\')">' + esc(o) + '</button>'; });
          innerHtml += '</div>';
        }
        innerHtml += '<div class="obs-row"><span class="obs-icon">📝</span><input type="text" class="obs-input" value="' + esc(obs) + '" placeholder="Observação..." oninput="ST.obs[\'' + q.id + '\']=this.value;triggerAutoSave()" /></div>';
        inputArea.innerHTML = innerHtml;
      }
    }
  }
  var done = card.querySelector('.q-done');
  if(isAnswered(id)){
    if(!done){ var d=document.createElement('div'); d.className='q-done'; d.textContent='✓'; card.querySelector('.q-header').appendChild(d); }
  } else {
    if(done) done.remove();
  }
}
function goTo(idx){
  currentStep = idx;
  renderApp();
  window.scrollTo(0,0);
}

// ─── TELA DE RESUMO ──────────────────────────────────────────────────────────
function showFinish(){
  var main = document.getElementById('stepContent');
  var p = totalAnswered();
  var e = ST.empresa;

  var blocosHtml = '';
  STEPS.forEach(function(s){
    if(!s.questions) return;
    var ans = s.questions.filter(function(q){ return isAnswered(q.id); }).length;
    var pct = Math.round(ans/s.questions.length*100);
    var color = pct===100?'#1E8449':pct>60?'#B7770D':'#C0392B';
    blocosHtml += '<div class="sum-bloco">';
    blocosHtml += '<div class="sum-bloco-icon">' + s.icon + '</div>';
    blocosHtml += '<div class="sum-bloco-info"><div class="sum-bloco-title">' + esc(s.title) + '</div>';
    blocosHtml += '<div class="sum-bloco-bar"><div class="sum-bloco-fill" style="width:' + pct + '%;background:' + color + '"></div></div></div>';
    blocosHtml += '<div class="sum-bloco-pct" style="color:' + color + '">' + ans + '/' + s.questions.length + '</div>';
    blocosHtml += '</div>';
  });

  var html = '<div class="step-view finish-view">';
  html += '<div class="finish-banner"><div class="finish-icon">🎉</div>';
  html += '<div class="finish-title">Diagnóstico Concluído!</div>';
  html += '<div class="finish-sub">' + p.ans + ' de ' + p.total + ' perguntas respondidas — ' + p.pct + '% de preenchimento</div>';
  html += '</div>';

  html += '<div class="finish-empresa">';
  html += '<div class="fe-label">EMPRESA</div>';
  html += '<div class="fe-name">' + esc(e.nome||'—') + '</div>';
  html += '<div class="fe-meta">' + esc(e.segmento||'') + (e.cidade?' · '+esc(e.cidade):'') + ' · ' + esc(e.data||'') + '</div>';
  html += '</div>';

  html += '<div class="sum-blocos">' + blocosHtml + '</div>';

  html += '<div class="finish-actions">';
  html += '<button class="btn btn-gold btn-big" onclick="gerarDoc()">📄 Gerar Documento Word</button>';
  html += '<button class="btn btn-outline" onclick="autoSave(); showToast(\'Diagnóstico salvo no banco!\')">💾 Salvar no Banco</button>';
  html += '<button class="btn btn-outline" onclick="exportJSON()">⬇️ Salvar JSON Local</button>';
  html += '<button class="btn btn-outline" onclick="goTo(0)">← Voltar ao Formulário</button>';
  html += '</div>';
  html += '</div>';
  main.innerHTML = html;
  main.scrollTop = 0;

  // deactivate nav
  document.querySelectorAll('.nav-item').forEach(function(el){ el.classList.remove('active'); });
}

function exportJSON(){
  var b = new Blob([JSON.stringify(ST,null,2)], {type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'diagnostico_' + ((ST.empresa.nome||'empresa').replace(/\s+/g,'_')) + '.json';
  a.click(); showToast('Rascunho salvo!');
}

// ─── GERAÇÃO DO DOCUMENTO ────────────────────────────────────────────────────
function gerarDoc(){
  var btn = event.target;
  btn.disabled = true; btn.textContent = '⏳ Gerando...';
  try {
    var D = window.docx;
    var E = ST.empresa;
    var today = E.data || new Date().toLocaleDateString('pt-BR');
    var NAVY='1B2A4A',BLUE='2E4A7A',GOLD='C9A84C',BL='D6E4F0',GR='F4F6F8';
    var RED='C0392B',GRN='1E8449',WHT='FFFFFF',MUT='6B7A8D',DARK='2C3E50';

    function b1(c){ return {style:D.BorderStyle.SINGLE,size:1,color:c||'CCCCCC'}; }
    function brd(c){ var b=b1(c); return {top:b,bottom:b,left:b,right:b}; }
    function noB(){ var b={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'}; return {top:b,bottom:b,left:b,right:b}; }
    function sh(f){ return {fill:f,type:D.ShadingType.CLEAR}; }
    function tc(w,fill,border,children,extra){
      var o={width:{size:w,type:D.WidthType.DXA},shading:sh(fill),borders:border||brd('CCCCCC'),margins:{top:80,bottom:80,left:120,right:120},children:children};
      if(extra) Object.assign(o,extra);
      return new D.TableCell(o);
    }
    function tr(cells){ return new D.TableRow({children:cells}); }
    function p(text,opts){
      var o=opts||{};
      return new D.Paragraph({spacing:{before:o.b||60,after:o.a||80},alignment:o.al||D.AlignmentType.LEFT,children:[
        new D.TextRun({text:String(text||''),size:o.sz||20,color:o.co||DARK,bold:!!o.bld,italic:!!o.it,font:'Arial'})
      ]});
    }
    function h1(text,color){ return new D.Paragraph({spacing:{before:440,after:160},border:{bottom:{style:D.BorderStyle.SINGLE,size:6,color:GOLD,space:4}},children:[new D.TextRun({text:text,bold:true,size:32,color:color||NAVY,font:'Arial'})]}); }
    function h2(text){ return new D.Paragraph({spacing:{before:280,after:100},children:[new D.TextRun({text:text,bold:true,size:24,color:BLUE,font:'Arial'})]}); }
    function sp(n){ var r=[]; for(var i=0;i<(n||1);i++) r.push(new D.Paragraph({spacing:{before:0,after:0},children:[new D.TextRun({text:'',size:16})]})); return r; }
    function pb(){ return new D.Paragraph({children:[new D.PageBreak()],spacing:{before:0,after:0}}); }
    function nb(){ var b={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'}; return {bottom:b,top:b,left:b,right:b,insideH:b,insideV:b}; }

    // ── CAPA ─────────────────────────────────────────────────────────────
    var cover = [
      new D.Paragraph({spacing:{before:1800,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:'DIAGNÓSTICO COMERCIAL',bold:true,size:64,color:NAVY,font:'Arial'})]}),
      new D.Paragraph({spacing:{before:120,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:'Política Comercial  ·  Força de Vendas  ·  CRM',size:26,color:MUT,font:'Arial',italic:true})]}),
      new D.Paragraph({spacing:{before:800,after:0},border:{bottom:{style:D.BorderStyle.SINGLE,size:12,color:GOLD,space:4}},children:[]})
    ].concat(sp(2)).concat([
      new D.Paragraph({spacing:{before:400,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:E.nome||'Empresa',bold:true,size:40,color:NAVY,font:'Arial'})]}),
      new D.Paragraph({spacing:{before:80,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:(E.segmento||'')+(E.cidade?' · '+E.cidade:''),size:22,color:MUT,font:'Arial'})]}),
    ]).concat(sp(6)).concat([
      new D.Table({
        width:{size:6400,type:D.WidthType.DXA},alignment:D.AlignmentType.CENTER,columnWidths:[2600,3800],
        rows:[
          ['Data do Diagnóstico',today],['Consultor Responsável',E.consultor||'—'],
          ['Participantes',E.participantes||'—'],['ERP / Sistema',E.erp||'—'],
          ['Faturamento Aproximado',E.faturamento||'—'],['Vendedores',E.vendedores||'—'],
          ['Clientes Ativos',E.clientes||'—']
        ].map(function(row,i){ var bg=i%2===0?GR:WHT;
          return tr([tc(2600,NAVY,brd(NAVY),[p(row[0],{co:WHT,bld:true,sz:19})]),tc(3800,bg,brd('CCCCCC'),[p(row[1],{sz:19})])]);
        })
      }),
      pb()
    ]);

    // ── RESUMO EXECUTIVO ─────────────────────────────────────────────────
    var pct = totalAnswered().pct;
    var statsRows = [
      ['Preenchimento do Diagnóstico', pct+'%'],
      ['Empresa / Razão Social', E.nome||'—'],
      ['Segmento de Atuação', E.segmento||'—'],
      ['ERP Utilizado', E.erp||'—'],
      ['Nº de Vendedores', E.vendedores||'—'],
      ['Nº de Clientes Ativos', E.clientes||'—'],
      ['Faturamento Aproximado', E.faturamento||'—']
    ].map(function(row,i){ var bg=i%2===0?GR:WHT;
      return tr([tc(4800,bg,brd('DDDDDD'),[p(row[0],{co:NAVY,sz:20})]),tc(4560,bg,brd('DDDDDD'),[p(row[1],{co:NAVY,bld:true,sz:20,al:D.AlignmentType.CENTER})])]);
    });
    var resumo = [
      h1('Resumo Executivo'),
      p('Resultado do diagnóstico de política comercial realizado com a equipe da empresa. As informações levantadas servem como base para parametrização e implantação das plataformas de Força de Vendas, CRM, Inside Sales e Gestão Comercial.',{sz:20})
    ].concat(sp(1)).concat([
      new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[4800,4560],
        rows:[tr([tc(4800,NAVY,brd(NAVY),[p('Indicador',{co:WHT,bld:true})]),tc(4560,NAVY,brd(NAVY),[p('Resultado',{co:WHT,bld:true,al:D.AlignmentType.CENTER})])])].concat(statsRows)
      })
    ]).concat(sp(2)).concat([pb()]);

    // ── BLOCOS DE PERGUNTAS ──────────────────────────────────────────────
    var blocoSecs = [];
    STEPS.forEach(function(s){
      if(!s.questions) return;
      var ans = s.questions.filter(function(q){ return isAnswered(q.id); }).length;
      blocoSecs.push(h1(s.icon + '  ' + s.title));
      blocoSecs.push(p(s.desc+' — '+ans+' de '+s.questions.length+' perguntas respondidas.',{co:MUT,it:true}));

      var hRow = tr([
        tc(120,NAVY,brd(NAVY),[p('')]),
        tc(4560,NAVY,brd(NAVY),[p('Pergunta',{co:WHT,bld:true,sz:18})]),
        tc(4680,NAVY,brd(NAVY),[p('Resposta Coletada',{co:WHT,bld:true,sz:18})])
      ]);
      var qRows = [];
      s.questions.forEach(function(q,i){
        var val = ST.respostas[q.id];
        var obs = ST.obs[q.id]||'';
        var valStr = Array.isArray(val) ? val.join(' · ') : (val||'Não respondido');
        var hasV = isAnswered(q.id);
        var bg = i%2===0 ? GR : WHT;
        var cc = q.crit==='ALTA' ? RED : q.crit==='MEDIA' ? 'B7770D' : GRN;

        qRows.push(tr([
          tc(120,cc,brd('FFFFFF'),[p('')]),
          tc(4560,bg,brd('DDDDDD'),[
            p((i+1)+'. '+q.q,{co:NAVY,sz:19}),
            p(tipoBadge(q.tipo)+' · Criticidade '+(q.crit||'Média'),{co:MUT,it:true,sz:16,b:0,a:0})
          ]),
          tc(4680,hasV?WHT:'FFF9F9',brd('DDDDDD'),[p(valStr,{co:hasV?NAVY:'AAAAAA',bld:hasV,sz:20})])
        ]));
        if(obs){
          var oc = new D.TableCell({columnSpan:2,width:{size:9240,type:D.WidthType.DXA},shading:sh(BL),borders:brd('DDDDDD'),margins:{top:60,bottom:60,left:160,right:120},children:[
            new D.Paragraph({children:[new D.TextRun({text:'Obs: ',bold:true,size:17,color:BLUE,font:'Arial'}),new D.TextRun({text:obs,size:17,color:'444444',italic:true,font:'Arial'})]})
          ]});
          qRows.push(tr([tc(120,BL,brd('DDDDDD'),[p('')]),oc]));
        }
      });

      blocoSecs.push(new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[120,4560,4680],rows:[hRow].concat(qRows)}));
      blocoSecs = blocoSecs.concat(sp(1));
    });
    blocoSecs.push(pb());

    // ── PARAMETRIZAÇÕES ──────────────────────────────────────────────────
    var params = [
      ['Clientes','Campos obrigatórios de cadastro de clientes'],
      ['Clientes','Documentos exigidos para ativação'],
      ['Crédito','Prazo de reativação para nova análise de crédito'],
      ['Crédito','Bloqueio automático para inadimplentes'],
      ['Frete','Valor mínimo para frete CIF'],
      ['Frete','Percentual de desconto FOB / redespacho'],
      ['Preço','Preço mínimo por produto'],
      ['Preço','Preço ideal (target) por produto'],
      ['Preço','Tabelas de preço por perfil e segmento'],
      ['Pagamento','Condições permitidas por perfil de vendedor'],
      ['Pagamento','Prazo médio por cliente'],
      ['Comissão','Base de cálculo e percentual por produto'],
      ['Estoque','Visibilidade de estoque por filial/CD'],
      ['Estoque','Múltiplos de embalagem por produto'],
      ['Bonificação','Regra de cashback sobre margem'],
      ['Aprovações','Níveis de alçada e responsáveis'],
      ['Aprovações','Gatilhos de aprovação automática']
    ];
    var pHdr = tr([tc(2000,NAVY,brd(NAVY),[p('Módulo',{co:WHT,bld:true})]),tc(5360,NAVY,brd(NAVY),[p('Regra / Parametrização',{co:WHT,bld:true})]),tc(2000,NAVY,brd(NAVY),[p('Status',{co:WHT,bld:true,al:D.AlignmentType.CENTER})])]);
    var pRows = params.map(function(row,i){ var bg=i%2===0?BL:WHT; return tr([tc(2000,bg,brd('DDDDDD'),[p(row[0],{co:BLUE,bld:true})]),tc(5360,bg,brd('DDDDDD'),[p(row[1])]),tc(2000,bg,brd('DDDDDD'),[p('⬜ Pendente',{co:MUT,al:D.AlignmentType.CENTER})])]); });
    var paramSec = [h1('Parametrizações Recomendadas'),p('Lista consolidada de regras a configurar na plataforma com base nas informações levantadas neste diagnóstico.',{sz:20})].concat(sp(1)).concat([new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[2000,5360,2000],rows:[pHdr].concat(pRows)})]).concat(sp(2)).concat([pb()]);

    // ── PRÓXIMOS PASSOS ──────────────────────────────────────────────────
    var steps = [
      'Revisão e validação das respostas com a equipe interna',
      'Definição das prioridades de parametrização (Quick Wins vs. Iniciativas Estratégicas)',
      'Mapeamento e aprovação formal do fluxo de alçadas',
      'Configuração inicial: tabelas de preço, condições de pagamento e perfis de vendedor',
      'Homologação com usuários-chave: gerente comercial, financeiro e TI',
      'Treinamento da equipe comercial e go-live faseado por módulo'
    ];
    var sRows = steps.map(function(s,i){ return tr([tc(800,i%2===0?GOLD:'B8963E',brd('CCCCCC'),[p(String(i+1),{co:NAVY,bld:true,al:D.AlignmentType.CENTER})]),tc(8560,i%2===0?GR:WHT,brd('DDDDDD'),[p(s,{co:NAVY,sz:20})])]); });
    var nextSec = [h1('Próximos Passos'),new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[800,8560],rows:sRows})].concat(sp(3)).concat([
      new D.Paragraph({spacing:{before:400,after:0},border:{top:{style:D.BorderStyle.SINGLE,size:2,color:'CCCCCC',space:8}},children:[new D.TextRun({text:'Gerado em '+today+' · Consultor: '+(E.consultor||'—')+' · Documento Confidencial',size:16,color:MUT,italic:true,font:'Arial'})]})
    ]);

    // ── HEADER / FOOTER ───────────────────────────────────────────────────
    var hc1 = new D.TableCell({width:{size:6200,type:D.WidthType.DXA},borders:noB(),margins:{top:60,bottom:60,left:0,right:0},children:[new D.Paragraph({children:[new D.TextRun({text:'DIAGNÓSTICO COMERCIAL  |  ',bold:true,size:18,color:NAVY,font:'Arial'}),new D.TextRun({text:E.nome||'Empresa',size:18,color:MUT,font:'Arial'})]})]});
    var hc2 = new D.TableCell({width:{size:3438,type:D.WidthType.DXA},borders:noB(),margins:{top:60,bottom:60,left:0,right:0},children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT,children:[new D.TextRun({text:today,size:18,color:MUT,font:'Arial'})]})]});
    var nb2 = {style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};
    var hdrObj = new D.Header({children:[new D.Table({width:{size:9638,type:D.WidthType.DXA},columnWidths:[6200,3438],rows:[tr([hc1,hc2])],borders:{bottom:{style:D.BorderStyle.SINGLE,size:4,color:GOLD,space:4},top:nb2,left:nb2,right:nb2,insideH:nb2,insideV:nb2}})]});

    var fc1 = new D.TableCell({width:{size:7000,type:D.WidthType.DXA},borders:noB(),children:[new D.Paragraph({children:[new D.TextRun({text:'Documento Confidencial · DiagComercial',size:16,color:MUT,italic:true,font:'Arial'})]})]});
    var fc2 = new D.TableCell({width:{size:2638,type:D.WidthType.DXA},borders:noB(),children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT,children:[new D.TextRun({text:'Página ',size:16,color:MUT,font:'Arial'}),new D.TextRun({children:[new D.PageNumber()],size:16,color:MUT,font:'Arial'})]})]});
    var ftrObj = new D.Footer({children:[new D.Table({width:{size:9638,type:D.WidthType.DXA},columnWidths:[7000,2638],rows:[tr([fc1,fc2])],borders:{top:{style:D.BorderStyle.SINGLE,size:2,color:'CCCCCC',space:4},bottom:nb2,left:nb2,right:nb2,insideH:nb2,insideV:nb2}})]});

    var children = cover.concat(resumo).concat(blocoSecs).concat(paramSec).concat(nextSec);

    var doc = new D.Document({
      styles:{default:{document:{run:{font:'Arial',size:20}}}},
      sections:[{
        properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134}}},
        headers:{default:hdrObj},footers:{default:ftrObj},
        children:children
      }]
    });

    D.Packer.toBuffer(doc).then(function(buf){
      var blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
      var fname = 'Diagnostico_Comercial_' + ((E.nome||'Empresa').replace(/\s+/g,'_')) + '_' + today.replace(/\//g,'-') + '.docx';
      window.saveAs(blob, fname);
      showToast('✅ Documento gerado com sucesso!');
      btn.disabled = false; btn.textContent = '📄 Gerar Documento Word';
    }).catch(function(err){
      showToast('Erro: ' + err.message, 'error');
      btn.disabled = false; btn.textContent = '📄 Gerar Documento Word';
    });
  } catch(err){
    showToast('Erro: ' + err.message, 'error');
    btn.disabled = false; btn.textContent = '📄 Gerar Documento Word';
    console.error(err);
  }
}

// INIT
window.addEventListener('DOMContentLoaded', init);
