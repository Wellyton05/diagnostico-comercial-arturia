// ═══════════════════════════════════════════════════════════════════
// DiagComercial v3
// ═══════════════════════════════════════════════════════════════════

// ── API STORAGE ──────────────────────────────────────────────────────
var DIAG_CACHE = [];
async function apiLoadAll(){
  try{ var r=await fetchWithAuth('/api/diagnosticos'); if(!r||!r.ok) return []; DIAG_CACHE=await r.json(); return DIAG_CACHE; }catch(e){ console.error(e); return []; }
}
async function apiLoad(dbId){
  try{ var r=await fetchWithAuth('/api/diagnosticos/'+dbId); if(!r||!r.ok) return null; return await r.json(); }catch(e){ console.error(e); return null; }
}
async function apiSave(st){
  var payload={nome:empName(st.empresa),cnpj:st.empresa.cnpj||'',segmento:st.empresa.segmento||'',cidade:st.empresa.cidade||'',data_json:st};
  try{
    var r;
    if(st._dbId){ r=await fetchWithAuth('/api/diagnosticos/'+st._dbId,{method:'PUT',body:JSON.stringify(payload)}); }
    else{ r=await fetchWithAuth('/api/diagnosticos',{method:'POST',body:JSON.stringify(payload)}); if(r&&r.ok){var d=await r.json(); st._dbId=d.id;} }
  }catch(e){ console.error(e); }
}
async function apiDelete(dbId){
  try{ await fetchWithAuth('/api/diagnosticos/'+dbId,{method:'DELETE'}); }catch(e){ console.error(e); }
}

// ── ESTADO ───────────────────────────────────────────────────────────
var MODE = 'list';
var CURRENT_ID = null;
var currentStep = 0;
var ST = null;

function newST(){
  return {
    criadoEm:new Date().toISOString(),atualizadoEm:new Date().toISOString(),
    empresa:{nome:'',cnpj:'',ie:'',razaoSocial:'',nomeFantasia:'',segmento:'',
      cidade:'',uf:'',cep:'',endereco:'',bairro:'',municipio:'',
      data:new Date().toLocaleDateString('pt-BR'),consultor:'',participantes:[],
      erp:'',vendedoresExternosPJ:'',vendedoresExternosCLT:'',vendedoresInternos:'',clientes:''},
    respostas:{},obs:{},anexos:{}
  };
}

// ── PERGUNTAS ─────────────────────────────────────────────────────────
var STEPS = [
  {id:'empresa',title:'Identificação da Empresa',icon:'🏢',desc:'Dados cadastrais da empresa.',fields:true},
  {id:'b0',title:'Cadastro de Novos Clientes',icon:'👥',desc:'Processo, documentos e políticas para cadastro de novos clientes.',questions:[
    {id:'q00',q:'Quais informações são obrigatórias para cadastrar um novo cliente?',tipo:'multi',crit:'ALTA',hint:'Ex: CNPJ, IE, Razão Social, Nome Fantasia, Endereço, Contato, E-mail. Selecione todos os que se aplicam.',opts:['CNPJ','Inscrição Estadual','Razão Social','Nome Fantasia','Endereço completo','Contato principal','E-mail','Telefone','Segmento','Região','Grupo Econômico','CEP']},
    {id:'q01',q:'Quais documentos/anexos são exigidos no cadastro? Indique a obrigatoriedade.',tipo:'docs_obrig',crit:'ALTA',hint:'Marque cada documento como Obrigatório, Opcional ou Não exigido.',opts:['Contrato Social','Cartão CNPJ','Inscrição Estadual','Comprovante de Endereço','Referências Comerciais','Procuração','RG/CPF dos sócios']},
    {id:'q01_anexo',q:'Anexar a ficha cadastral da empresa (modelo/template utilizado atualmente).',tipo:'file',crit:'MEDIA',hint:'Faça upload do arquivo PDF, Word ou Excel com o formulário de cadastro atual.'},
    {id:'q02',q:'Existe divisão de carteira por vendedor?',tipo:'yn',crit:'ALTA',hint:'Ex: cada vendedor possui sua lista exclusiva de clientes, sem sobreposição entre vendedores.'},
    {id:'q03',q:'Um cliente pode ter mais de um vendedor responsável?',tipo:'yn',crit:'MEDIA',hint:'Ex: cliente atendido por vendedor regional e key account simultaneamente.'},
    {id:'q04',q:'Existem políticas de preço diferentes por classificação do cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: clientes Gold, Silver, Bronze com tabelas de preço distintas.'},
    {id:'q05',q:'Quais critérios definem a classificação do cliente?',tipo:'multi',crit:'ALTA',hint:'Ex: volume de compra mensal, frequência de pedidos, potencial de mercado.',opts:['Volume de Compras','Frequência de Compra','Segmento de Mercado','Região','Potencial de Compra','Score de Crédito','Mix de Produtos','Tempo de relacionamento']},
    {id:'q06',q:'Existe processo de aprovação para novos cadastros?',tipo:'yn',crit:'MEDIA',hint:'Ex: cadastro passa por aprovação do financeiro antes de ser ativado no sistema.'},
    {id:'q07',q:'Quem aprova o cadastro de novos clientes?',tipo:'text',crit:'MEDIA',hint:'Ex: Gerente Comercial, Departamento de Crédito, Diretor Financeiro.',ph:'Ex: Gerente Comercial e Depto. de Crédito'}
  ]},
  {id:'b1',title:'Risco & Crédito',icon:'🛡️',desc:'Análise de crédito, limites e gestão de risco financeiro.',questions:[
    {id:'q10',q:'Após quanto tempo sem comprar o cliente precisa de nova análise de crédito?',tipo:'single',crit:'ALTA',hint:'Ex: se um cliente ficar 90 dias sem comprar, ele passa novamente pela análise antes de emitir pedido.',opts:['30 dias','60 dias','90 dias','180 dias','1 ano','Não se aplica']},
    {id:'q11',q:'O vendedor pode emitir pedido para cliente inadimplente com aprovação por alçada?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente com título vencido, mas o gerente pode aprovar a liberação do pedido.'},
    {id:'q12',q:'O vendedor pode emitir pedido para cliente sem limite de crédito com aprovação?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente novo sem análise concluída; pedido fica em aprovação até liberação.'},
    {id:'q13',q:'Quem define o limite de crédito de cada cliente?',tipo:'single',crit:'ALTA',hint:'Ex: financeiro define com base em análise de bureau, ou ERP calcula automaticamente.',opts:['Departamento Financeiro','Diretoria','Equipe de Vendas','Automatizado pelo ERP','Comitê de Crédito']},
    {id:'q14',q:'Com qual periodicidade o limite de crédito é revisado?',tipo:'single',crit:'MEDIA',hint:'Ex: todo trimestre o financeiro revisa os limites de clientes ativos.',opts:['Mensal','Trimestral','Semestral','Anual','Somente sob demanda']},
    {id:'q15',q:'O sistema de análise de crédito é integrado ao ERP?',tipo:'yn',crit:'MEDIA',hint:'Ex: Serasa, SPC ou bureau de crédito integrado diretamente ao TOTVS/SAP.'},
    {id:'q16',q:'Existem regras de crédito diferenciadas por segmento ou perfil de cliente?',tipo:'yn',crit:'MEDIA',hint:'Ex: atacadista tem limite maior que varejista; indústria tem prazo diferente de distribuidor.'}
  ]},
  {id:'b2',title:'Frete',icon:'🚚',desc:'Política de frete, modalidades e integração logística.',questions:[
    {id:'q20',q:'Qual o valor mínimo de pedido para frete CIF (pago pelo fornecedor)?',tipo:'text',crit:'ALTA',hint:'Ex: pedidos acima de R$ 2.000 têm frete por conta da empresa; abaixo disso, cliente paga.',ph:'Ex: R$ 2.000,00'},
    {id:'q21',q:'Qual o percentual de desconto concedido na modalidade FOB?',tipo:'text',crit:'ALTA',hint:'Ex: cliente retira na fábrica e recebe 3,5% de desconto sobre o valor do pedido.',ph:'Ex: 3,5%'},
    {id:'q22',q:'Qual o percentual de desconto no redespacho?',tipo:'text',crit:'ALTA',hint:'Ex: cliente usa transportadora própria no trecho final e recebe 2% de desconto.',ph:'Ex: 2%'},
    {id:'q23',q:'Existe integração com sistema de cálculo de frete?',tipo:'yn',crit:'MEDIA',hint:'Ex: Intelipost, Melhor Envio ou integração direta com transportadora via API.'},
    {id:'q24',q:'Qual sistema ou transportadora é utilizado?',tipo:'text',crit:'MEDIA',hint:'Ex: Jadlog, Braspress, transportadora própria, Intelipost como middleware.',ph:'Ex: Braspress + Intelipost para cálculo'},
    {id:'q25',q:'O frete é calculado com base em qual critério principal?',tipo:'multi',crit:'ALTA',hint:'Ex: tabela fixa por estado + peso mínimo. Selecione todos que se aplicam.',opts:['Tabela fixa por região','Peso do pedido','Valor do pedido','Transportadora específica','Distância em km','Volume em m³']},
    {id:'q26',q:'Existem exceções de frete para clientes ou regiões específicas?',tipo:'yn',crit:'MEDIA',hint:'Ex: cliente estratégico sempre CIF independente do valor; norte/nordeste tem tabela diferente.'}
  ]},
  {id:'b3',title:'Preço',icon:'💲',desc:'Política de precificação, tabelas e regras de desconto.',questions:[
    {id:'q30',q:'Possui política de preço diferenciada por classificação de cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: tabela A para distribuidores, tabela B para varejo, tabela C para consumidor final.'},
    {id:'q31',q:'Existe diferenciação de regras entre representante, vendedor CLT e inside sales?',tipo:'yn',crit:'ALTA',hint:'Ex: representante pode conceder até 5% de desconto; vendedor CLT até 3%; inside sales zero desconto.'},
    {id:'q32',q:'Quais perfis possuem regras de preço diferentes?',tipo:'multi',crit:'ALTA',hint:'Ex: representante externo tem margem diferente de quem está no call center.',opts:['Representante Comercial PJ','Vendedor CLT Externo','Vendedor CLT Interno (Inside Sales)','Televendas','Key Account Manager','Distribuidor']},
    {id:'q33',q:'Existe preço mínimo definido por produto?',tipo:'yn',crit:'ALTA',hint:'Ex: produto X não pode ser vendido abaixo de R$ 45,00 independente do desconto concedido.'},
    {id:'q34',q:'Existe preço ideal (target) para cálculo de margem e saúde do pedido?',tipo:'yn',crit:'ALTA',hint:'Ex: preço target é R$ 52,00; vender abaixo do target já sinaliza pedido "em risco".'},
    {id:'q35',q:'Com qual periodicidade os preços são reajustados?',tipo:'single',crit:'MEDIA',hint:'Ex: todo mês de janeiro faz-se o reajuste anual + ajuste de março conforme INPC.',opts:['Mensal','Trimestral','Semestral','Anual','Conforme necessidade / INPC']},
    {id:'q36',q:'As tabelas de preço consideram impostos (ICMS, ST, frete)?',tipo:'yn',crit:'ALTA',hint:'Ex: tabela já embute o ICMS do estado destino e a substituição tributária.'},
    {id:'q37',q:'Existe tabela de preço específica por cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente X tem desconto fixo de 8% negociado em contrato, refletido em tabela dedicada.'},
    {id:'q38',q:'Existe tabela de preço por classificação de cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: Tabela Gold para clientes A, Tabela Silver para clientes B.'},
    {id:'q39',q:'Existe desconto padrão previsto em tabela?',tipo:'yn',crit:'ALTA',hint:'Ex: tabela já traz desconto de 5% para pagamento à vista embutido.'},
    {id:'q3a',q:'Quantas tabelas de preço existem atualmente?',tipo:'text',crit:'MEDIA',hint:'Ex: 4 tabelas (A, B, C e clientes especiais) mais 2 tabelas por estado.',ph:'Ex: 4 tabelas principais'},
    {id:'q3b',q:'Como as tabelas de preço são distribuídas aos vendedores?',tipo:'multi',crit:'MEDIA',hint:'Ex: PDF enviado por e-mail todo mês ou disponível no sistema.',opts:['ERP / Sistema','Planilha Excel','PDF impresso','Portal web','WhatsApp','E-mail']}
  ]},
  {id:'b4',title:'Condição de Pagamento',icon:'💳',desc:'Prazos, formas e regras de pagamento.',questions:[
    {id:'q40',q:'Existe condição de pagamento específica por cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente A negociou 60 dias; cliente B paga sempre 28 DDL.'},
    {id:'q41',q:'Existe prazo médio de pagamento definido por cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: prazo médio de 30 dias definido no cadastro limita as condições disponíveis.'},
    {id:'q42',q:'Os vendedores podem escolher livremente as condições de pagamento?',tipo:'yn',crit:'ALTA',hint:'Ex: vendedor pode oferecer qualquer condição disponível, ou há regra limitando por perfil/cliente?'},
    {id:'q43',q:'Existe desconto financeiro para alguma condição de pagamento?',tipo:'yn',crit:'ALTA',hint:'Ex: à vista com PIX tem 5% de desconto; 7 dias tem 3%; 30/60 dias não tem desconto.'},
    {id:'q44',q:'Descreva as condições de pagamento e seus descontos:',tipo:'cond_pagamento',crit:'ALTA',hint:'Informe cada condição, o desconto aplicado e observações relevantes.'},
    {id:'q45',q:'Quais formas de pagamento são aceitas?',tipo:'multi',crit:'ALTA',hint:'Ex: PIX e boleto para todos; cartão só para pedidos acima de R$ 500.',opts:['Boleto bancário','PIX','Cartão de crédito','Depósito / TED','Cheque','Crédito em conta','Consignado']},
    {id:'q46',q:'A condição de pagamento está vinculada ao limite de crédito do cliente?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente com limite de R$ 10.000 só pode usar condições de até 30 dias.'},
    {id:'q47',q:'O sistema bloqueia automaticamente pedidos com condição acima do limite disponível?',tipo:'yn',crit:'MEDIA',hint:'Ex: se cliente está com R$ 8.000 de limite e faz pedido de R$ 9.000, o sistema bloqueia.'}
  ]},
  {id:'b5',title:'Comissão',icon:'💰',desc:'Estrutura, cálculo e relatórios de comissões.',questions:[
    {id:'q50',q:'Como são calculadas as comissões da equipe comercial?',tipo:'multi',crit:'ALTA',hint:'Ex: representante recebe sobre faturamento bruto; vendedor CLT sobre recebimento líquido.',opts:['Sobre faturamento bruto','Sobre recebimento','Sobre margem de contribuição','Por produto / linha','Mix de produtos','Volume de vendas']},
    {id:'q51',q:'As comissões são diferenciadas por produto ou linha de produto?',tipo:'yn',crit:'ALTA',hint:'Ex: linha premium paga 4% de comissão; linha básica paga 2%.'},
    {id:'q52',q:'Existe comissão escalonada por volume ou meta atingida?',tipo:'yn',crit:'MEDIA',hint:'Ex: até 80% da meta paga 2%; de 80% a 100% paga 3%; acima de 100% paga 5%.'},
    {id:'q53',q:'Como o relatório de comissões é disponibilizado para os vendedores?',tipo:'multi',crit:'MEDIA',hint:'Ex: planilha Excel enviada por e-mail todo dia 5 do mês seguinte.',opts:['ERP / Sistema','Planilha Excel','PDF','Portal web','WhatsApp','Nenhum relatório atual']},
    {id:'q54',q:'Qual a periodicidade de pagamento das comissões?',tipo:'single',crit:'ALTA',hint:'Ex: pago todo dia 15 do mês seguinte ao faturamento.',opts:['Semanal','Quinzenal','Mensal','Bimestral','Conforme faturamento','Conforme recebimento']},
    {id:'q55',q:'Existe estrutura de comissão diferente para representantes externos?',tipo:'yn',crit:'MEDIA',hint:'Ex: representante PJ emite nota de comissão; vendedor CLT tem desconto em folha.'},
    {id:'q56',q:'O sistema atual calcula comissões automaticamente?',tipo:'yn',crit:'MEDIA',hint:'Ex: ERP calcula e gera relatório; ou é feito manualmente em planilha.'}
  ]},
  {id:'b6',title:'Estoque',icon:'📦',desc:'Visibilidade, regras de venda e gestão de estoque.',questions:[
    {id:'q60',q:'Estoques de quais filiais / CDs serão visíveis ao vendedor?',tipo:'multi',crit:'ALTA',hint:'Ex: vendedor de SP só vê CD São Paulo + CD Campinas; vendedor nacional vê todos.',opts:['Todas as filiais','Filiais regionais','CD específico por região','Apenas CD principal','Conforme perfil do vendedor']},
    {id:'q61',q:'Os produtos são vendidos em embalagens com múltiplos (caixas, fardos, paletes)?',tipo:'yn',crit:'ALTA',hint:'Ex: produto X só vende em caixa de 12 unidades; não pode vender avulso.'},
    {id:'q62',q:'É permitida a venda de produto sem estoque mediante aprovação por alçada?',tipo:'yn',crit:'ALTA',hint:'Ex: produto em falta pode ser vendido com prazo de entrega maior, mas precisa de aprovação.'},
    {id:'q63',q:'O estoque reservado pelo pedido é atualizado em tempo real no sistema?',tipo:'yn',crit:'MEDIA',hint:'Ex: ao fechar o pedido, o sistema já debita o estoque; ou só debita na fatura?'},
    {id:'q64',q:'Existem produtos com estoque mínimo configurado?',tipo:'yn',crit:'MEDIA',hint:'Ex: produto estratégico tem mínimo de 500 unidades; quando atingir gera alerta automático.'},
    {id:'q65',q:'O vendedor visualiza o saldo de estoque no momento do pedido?',tipo:'yn',crit:'ALTA',hint:'Ex: no aplicativo ou sistema de pedidos, o vendedor vê "200 unidades disponíveis" em tempo real.'}
  ]},
  {id:'b7',title:'Bonificação & Cashback',icon:'🎁',desc:'Programas de bonificação, cashback e verbas promocionais.',questions:[
    {id:'q70',q:'Existe política de bonificação ou cashback para clientes?',tipo:'yn',crit:'ALTA',hint:'Ex: cliente que compra acima de X por mês recebe Y% de volta como crédito ou produto.'},
    {id:'q71',q:'Qual o percentual de venda acima do preço mínimo que gera cashback?',tipo:'text',crit:'ALTA',hint:'Ex: vendendo 5% acima do preço mínimo, 50% dessa margem extra vira cashback ao cliente.',ph:'Ex: 5% acima do mínimo'},
    {id:'q72',q:'A bonificação é concedida em qual formato?',tipo:'multi',crit:'ALTA',hint:'Ex: bonificação em produto (NF de bonificação) ou desconto na próxima NF.',opts:['Produto / mercadoria','Desconto em nota fiscal','Crédito para próxima compra','Transferência financeira','Vale-compra']},
    {id:'q73',q:'Existe verba promocional destinada a clientes estratégicos?',tipo:'yn',crit:'MEDIA',hint:'Ex: budget anual por cliente para ações de PDV, promotores ou co-investimento em marketing.'},
    {id:'q74',q:'As bonificações são aprovadas por alçada antes de serem concedidas?',tipo:'yn',crit:'ALTA',hint:'Ex: bonificação acima de R$ 500 precisa de aprovação do gerente comercial.'},
    {id:'q75',q:'Como as bonificações são registradas / controladas atualmente?',tipo:'multi',crit:'MEDIA',hint:'Ex: planilha do financeiro + NF de bonificação no ERP.',opts:['ERP / Sistema','Planilha Excel','Controle manual','Sistema próprio','Não há controle formal']}
  ]},
  {id:'b8',title:'Promoções & Campanhas',icon:'🎯',desc:'Campanhas comerciais, promoções sazonais e controle.',questions:[
    {id:'q80',q:'Existem campanhas com preços exclusivos por período determinado?',tipo:'yn',crit:'ALTA',hint:'Ex: campanha de outubro com 10% de desconto na linha X válida de 01/10 a 31/10.'},
    {id:'q81',q:'Como as promoções são controladas e comunicadas atualmente?',tipo:'multi',crit:'ALTA',hint:'Ex: tabela de promoção no ERP com data início/fim + comunicado por e-mail à equipe.',opts:['ERP / Sistema','Planilha Excel','WhatsApp','Sistema próprio','E-mail / intranet','Sem controle formal']},
    {id:'q82',q:'As promoções respeitam o preço mínimo estabelecido por produto?',tipo:'yn',crit:'ALTA',hint:'Ex: mesmo em promoção, o sistema impede preço abaixo do mínimo cadastrado.'},
    {id:'q83',q:'Quem aprova o lançamento de uma campanha promocional?',tipo:'text',crit:'ALTA',hint:'Ex: Gerente Comercial propõe, Diretor aprova; ou comitê de marketing e vendas.',ph:'Ex: Diretor Comercial + Gerente de Marketing'},
    {id:'q84',q:'As promoções são segmentadas por tipo ou perfil de cliente?',tipo:'yn',crit:'MEDIA',hint:'Ex: promoção de atacado só vale para distribuidores; não aparece para varejistas.'},
    {id:'q85',q:'Existe calendário comercial de campanhas e promoções?',tipo:'yn',crit:'MEDIA',hint:'Ex: calendário anual com datas de Black Friday, liquidações e campanhas sazonais planejadas.'}
  ]},
  {id:'b9',title:'Motivos de Não Venda',icon:'📊',desc:'Registro e análise de oportunidades perdidas.',questions:[
    {id:'q90',q:'Quais são os possíveis motivos de não venda registrados?',tipo:'multi',crit:'ALTA',hint:'Ex: vendedor fecha a visita sem pedido e obrigatoriamente informa o motivo no sistema.',opts:['Preço acima do mercado','Concorrência','Falta de estoque','Crédito bloqueado','Frete elevado','Prazo de entrega longo','Produto inadequado','Problema de entrega anterior','Relacionamento / atendimento','Cliente não compra mais']},
    {id:'q91',q:'Os motivos de não venda são registrados pelo vendedor no sistema?',tipo:'yn',crit:'ALTA',hint:'Ex: campo obrigatório no app de força de vendas ao fechar uma visita sem pedido.'},
    {id:'q92',q:'A gestão analisa periodicamente os motivos de não venda?',tipo:'yn',crit:'MEDIA',hint:'Ex: relatório mensal para o gerente com ranking de motivos por região/produto.'},
    {id:'q93',q:'O registro de motivo é obrigatório para fechar uma visita/contato?',tipo:'yn',crit:'MEDIA',hint:'Ex: sistema não permite encerrar a visita sem selecionar pelo menos um motivo.'}
  ]},
  {id:'b10',title:'Fluxo de Aprovações',icon:'✅',desc:'Processo de aprovação por alçada — quem aprova o quê.',questions:[
    {id:'qa0',q:'Existem níveis diferentes de alçada de aprovação?',tipo:'yn',crit:'ALTA',hint:'Ex: gerente aprova até 5% de desconto; diretor aprova de 5% a 10%; acima de 10% vai para comitê.'},
    {id:'qa1',q:'Quem são os responsáveis pelas aprovações comerciais? (nome e cargo)',tipo:'text',crit:'ALTA',hint:'Ex: João Silva — Gerente Comercial (desconto até 8%) / Maria Costa — Diretora (acima de 8%).',ph:'Ex: João Silva — Gerente Comercial'},
    {id:'qa2',q:'Quem são os responsáveis pelas aprovações financeiras? (nome e cargo)',tipo:'text',crit:'ALTA',hint:'Ex: Pedro Alves — Gerente Financeiro (crédito até R$ 50k) / CFO (acima de R$ 50k).',ph:'Ex: Pedro Alves — Gerente Financeiro'},
    {id:'qa3',q:'Quem aprova condições comerciais especiais?',tipo:'text',crit:'ALTA',hint:'Ex: prazo acima de 60 dias, frete CIF abaixo do mínimo, bonificação especial.',ph:'Ex: Diretor Comercial + Diretora Financeira'},
    {id:'qa4',q:'O processo de aprovação é manual ou automatizado?',tipo:'single',crit:'ALTA',hint:'Ex: vendedor liga para o gerente (manual); ou pedido fica "aguardando aprovação" no sistema.',opts:['100% Manual (telefone/WhatsApp)','Parcialmente automatizado (sistema + confirmação manual)','100% Automatizado (sistema aprova/rejeita)']},
    {id:'qa5',q:'Quais setores participam do fluxo de aprovação?',tipo:'multi',crit:'ALTA',hint:'Ex: desconto comercial passa só pelo comercial; crédito especial passa por comercial e financeiro.',opts:['Comercial','Financeiro / Crédito','Diretoria','Estoque / Logística','Jurídico','Marketing']},
    {id:'qa6',q:'O aprovador recebe alerta automático (e-mail, WhatsApp, app)?',tipo:'yn',crit:'MEDIA',hint:'Ex: sistema envia e-mail para o gerente quando há pedido aguardando aprovação há mais de 2 horas.'},
    {id:'qa7',q:'Existe prazo máximo para aprovação antes de o pedido expirar?',tipo:'yn',crit:'MEDIA',hint:'Ex: pedido expira em 24h se não aprovado; vendedor é notificado para reenviar.'},
    {id:'qa8',q:'Descreva como funciona o fluxo de aprovação por alçada hoje:',tipo:'textarea',crit:'ALTA',hint:'Descreva o processo passo a passo: quem solicita, quem aprova, como é comunicado, prazo.',ph:'Ex: Vendedor faz o pedido com desconto acima do permitido → sistema envia e-mail para gerente → gerente aprova ou rejeita → vendedor é notificado...'}
  ]}
];

// ── EXEMPLO ───────────────────────────────────────────────────────────
var EXEMPLO = {
  id:'exemplo_001',criadoEm:'2025-03-15T09:00:00.000Z',atualizadoEm:'2025-03-15T17:30:00.000Z',
  empresa:{nome:'Distribuidora Alimentos Norte S.A.',cnpj:'12.345.678/0001-90',ie:'123.456.789.000',razaoSocial:'Distribuidora Alimentos Norte S.A.',nomeFantasia:'Dist. Alimentos Norte',segmento:'Distribuição de Alimentos',cidade:'Manaus',uf:'AM',cep:'69000-000',endereco:'Av. Djalma Batista, 1500',bairro:'Chapada',municipio:'Manaus',data:'15/03/2025',consultor:'Carlos Mendes',participantes:[{nome:'Roberto Faria',cargo:'Diretor Comercial',area:'Comercial'},{nome:'Ana Paula Souza',cargo:'Gerente Financeira',area:'Financeiro'},{nome:'Marcos Lima',cargo:'Coordenador de TI',area:'TI'}],erp:'TOTVS Protheus v12',vendedoresExternosPJ:'8',vendedoresExternosCLT:'5',vendedoresInternos:'4',clientes:'620'},
  respostas:{'q00':['CNPJ','Inscrição Estadual','Razão Social','Nome Fantasia','Endereço completo','Contato principal','E-mail','Telefone','Segmento','Região'],'q01':{'Contrato Social':'Obrigatório','Cartão CNPJ':'Obrigatório','Inscrição Estadual':'Obrigatório','Comprovante de Endereço':'Opcional','Referências Comerciais':'Opcional'},'q02':'Sim','q03':'Não','q04':'Sim','q05':['Volume de Compras','Frequência de Compra','Segmento de Mercado'],'q06':'Sim','q07':'Gerente Comercial e Departamento de Crédito','q10':'90 dias','q11':'Sim','q12':'Sim','q13':'Departamento Financeiro','q14':'Trimestral','q15':'Não','q16':'Sim','q20':'R$ 1.500,00','q21':'4%','q22':'2%','q23':'Não','q24':'Transportadora própria + Jadlog para interior','q25':['Tabela fixa por região','Valor do pedido'],'q26':'Sim','q30':'Sim','q31':'Sim','q32':['Representante Comercial PJ','Vendedor CLT Externo','Vendedor CLT Interno (Inside Sales)'],'q33':'Sim','q34':'Sim','q35':'Anual','q36':'Sim','q37':'Não','q38':'Sim','q39':'Sim','q3a':'3 tabelas (Ouro, Prata, Bronze)','q3b':['ERP / Sistema','Planilha Excel'],'q40':'Sim','q41':'Sim','q42':'Não','q43':'Sim','q44':[{cond:'À vista PIX',desc:'5%',obs:''},{cond:'7 dias',desc:'3%',obs:''},{cond:'28 DDL',desc:'0%',obs:'Padrão da maioria dos clientes'},{cond:'30/60 dias',desc:'0%',obs:'Apenas clientes Gold'}],'q45':['Boleto bancário','PIX','Depósito / TED'],'q46':'Sim','q47':'Sim','q50':['Sobre faturamento bruto','Por produto / linha'],'q51':'Sim','q52':'Não','q53':['Planilha Excel'],'q54':'Mensal','q55':'Sim','q56':'Não','q60':['Todas as filiais'],'q61':'Sim','q62':'Sim','q63':'Sim','q64':'Não','q65':'Sim','q70':'Sim','q71':'5% acima do mínimo gera 50% de cashback sobre a margem extra','q72':['Desconto em nota fiscal','Crédito para próxima compra'],'q73':'Não','q74':'Sim','q75':['Planilha Excel','ERP / Sistema'],'q80':'Sim','q81':['ERP / Sistema','WhatsApp'],'q82':'Sim','q83':'Diretor Comercial','q84':'Sim','q85':'Não','q90':['Preço acima do mercado','Concorrência','Falta de estoque','Crédito bloqueado'],'q91':'Sim','q92':'Não','q93':'Não','qa0':'Sim','qa1':'Roberto Faria — Diretor Comercial (até 8% desconto)','qa2':'Ana Paula Souza — Gerente Financeira (crédito até R$ 30k)','qa3':'Diretor Comercial + Gerente Financeira','qa4':'Parcialmente automatizado (sistema + confirmação manual)','qa5':['Comercial','Financeiro / Crédito','Diretoria'],'qa6':'Não','qa7':'Sim','qa8':'Vendedor registra o pedido no TOTVS com condição especial → sistema bloqueia e envia e-mail para Diretor → Diretor aprova no TOTVS → vendedor recebe notificação. Prazo máximo: 48 horas.'},
  obs:{'q02':'Exceção: clientes multiestado podem ter 2 vendedores','q11':'Limite de até R$ 5.000 para pedidos de inadimplentes','q20':'Exceção: Norte e Nordeste têm CIF a partir de R$ 1.000','q33':'Preço mínimo revisado trimestralmente com base nos custos'},
  anexos:{}
};

// ── UTILS ─────────────────────────────────────────────────────────────
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function empName(e){ return e?(e.nomeFantasia||e.razaoSocial||e.nome||''):''; }
function isAnswered(id){
  var v=ST&&ST.respostas?ST.respostas[id]:null;
  if(v===undefined||v===null||v==='') return false;
  if(Array.isArray(v)) return v.length>0;
  if(typeof v==='object') return Object.keys(v).length>0;
  return true;
}
function totalAnswered(){
  var total=0,ans=0;
  STEPS.forEach(function(s){ if(s.questions){ total+=s.questions.length; s.questions.forEach(function(q){ if(isAnswered(q.id)) ans++; }); } });
  return {total:total,ans:ans,pct:total>0?Math.round(ans/total*100):0};
}
function showToast(msg,type){
  var t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show '+(type||'');
  clearTimeout(window._tt); window._tt=setTimeout(function(){t.classList.remove('show');},3200);
}
function fmtDate(iso){ try{ return new Date(iso).toLocaleDateString('pt-BR'); }catch(e){ return ''; } }
function tipoLbl(t){ return {yn:'Sim / Não',single:'Seleção Única',multi:'Múltipla Escolha',text:'Texto Livre',textarea:'Texto',file:'Arquivo',docs_obrig:'Documentos',cond_pagamento:'Tabela'}[t]||t; }
function valToStr(val){
  if(!val&&val!==0) return '—';
  if(Array.isArray(val)){
    if(val.length===0) return '—';
    if(typeof val[0]==='object') return val.map(function(r){ return (r.cond||'')+(r.desc?' → '+r.desc:'')+(r.obs?' ('+r.obs+')':''); }).filter(Boolean).join(' · ');
    return val.join(', ');
  }
  if(typeof val==='object') return Object.entries(val).map(function(kv){ return kv[0]+': '+kv[1]; }).join(' · ');
  return String(val);
}

// ── ROTEADOR ──────────────────────────────────────────────────────────
async function route(mode,id){
  MODE=mode; CURRENT_ID=id||null;
  if(mode==='list'){ currentStep=0; ST=null; await renderList(); }
  else if(mode==='new'){ currentStep=0; ST=newST(); renderApp(); }
  else if(mode==='edit'||mode==='view'){
    var item=await apiLoad(id);
    if(item){ ST=typeof item.data_json==='string'?JSON.parse(item.data_json):item.data_json; ST._dbId=item.id; }
    else{ ST=newST(); }
    currentStep=0; renderApp(mode==='view');
  }
}
async function saveCurrent(){ if(!ST) return; ST.atualizadoEm=new Date().toISOString(); await apiSave(ST); }
function maybeSave(){ if(ST&&MODE==='edit'){ saveCurrent(); } route('list'); }
function goTo(idx){ currentStep=idx; renderStep(MODE==='view'); refreshSidebar(); scrollToTop(); }
function scrollToTop(){ var m=document.getElementById('mainArea'); if(m) m.scrollTop=0; }

// ── LISTA ─────────────────────────────────────────────────────────────
async function renderList(){
  var app=document.getElementById('app');
  var rawItems=await apiLoadAll();
  var items=rawItems.map(function(item){ var d=typeof item.data_json==='string'?JSON.parse(item.data_json):item.data_json; d._dbId=item.id; d._updatedAt=item.updated_at; return d; });
  var html='<div class="page-list">';
  html+='<div class="list-header"><div><div class="list-title">Diagnósticos</div><div class="list-sub">'+items.length+' registro'+(items.length!==1?'s':'')+'</div></div>';
  html+='<div class="list-header-actions"><button class="btn-n" onclick="loadExemplo()">📂 Carregar Exemplo</button><button class="btn-n primary" onclick="route(\'new\')">+ Novo Diagnóstico</button></div></div>';
  html+='<input type="text" class="search-input" placeholder="🔍  Buscar por empresa, segmento ou cidade..." oninput="filterList(this.value)"/>';
  html+='<div id="listContainer">';
  if(items.length===0){
    html+='<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Nenhum diagnóstico ainda</div><div class="empty-sub">Clique em "+ Novo Diagnóstico" ou carregue o exemplo.</div></div>';
  } else { items.forEach(function(d){ html+=listRow(d); }); }
  html+='</div></div>';
  app.innerHTML=html;
}
function listRow(d){
  var p=0,t=0;
  STEPS.forEach(function(s){ if(s.questions){ t+=s.questions.length; s.questions.forEach(function(q){ var v=d.respostas&&d.respostas[q.id]; if(v!==undefined&&v!==''&&!(Array.isArray(v)&&v.length===0)) p++; }); } });
  var pct=t>0?Math.round(p/t*100):0;
  var col=pct===100?'var(--green)':pct>60?'#B7770D':'#C0392B';
  var dbId=d._dbId;
  var en=empName(d.empresa);
  var html='<div class="list-row" onclick="route(\'view\','+dbId+')">';
  html+='<div class="list-main"><div class="list-name">'+esc(en?en:'Sem nome')+'</div>';
  html+='<div class="list-meta">'+(d.empresa&&d.empresa.segmento?'<span>'+esc(d.empresa.segmento)+'</span>':'')+(d.empresa&&d.empresa.cidade?'<span>'+esc(d.empresa.cidade+(d.empresa.uf?'/'+d.empresa.uf:''))+'</span>':'')+'<span>'+fmtDate(d._updatedAt||d.atualizadoEm)+'</span></div>';
  html+='<div class="list-bar"><div class="list-fill" style="width:'+pct+'%;background:'+col+'"></div></div></div>';
  html+='<div class="list-pct" style="color:'+col+'">'+pct+'%</div>';
  html+='<div class="list-actions" onclick="event.stopPropagation()">';
  html+='<button class="icon-btn" title="Editar" onclick="route(\'edit\','+dbId+')">✏️</button>';
  html+='<button class="icon-btn" title="Visualizar" onclick="route(\'view\','+dbId+')">👁️</button>';
  html+='<button class="icon-btn" title="Ver resumo" onclick="route(\'view\','+dbId+');setTimeout(showResumoPage,200)">📄</button>';
  html+='<button class="icon-btn danger" title="Excluir" onclick="deleteDiag('+dbId+')">🗑️</button>';
  html+='</div></div>';
  return html;
}
function filterList(q){
  var items=DIAG_CACHE.map(function(item){ var d=typeof item.data_json==='string'?JSON.parse(item.data_json):item.data_json; d._dbId=item.id; d._updatedAt=item.updated_at; return d; });
  items=items.filter(function(d){ return (empName(d.empresa)+(d.empresa.segmento||'')+(d.empresa.cidade||'')+(d.empresa.consultor||'')).toLowerCase().includes(q.toLowerCase()); });
  var c=document.getElementById('listContainer');
  if(!c) return;
  if(items.length===0){ c.innerHTML='<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Nenhum resultado</div></div>'; return; }
  c.innerHTML=items.map(listRow).join('');
}
async function deleteDiag(dbId){ if(!confirm('Excluir este diagnóstico? Esta ação não pode ser desfeita.')) return; await apiDelete(dbId); await renderList(); showToast('Diagnóstico excluído'); }
async function loadExemplo(){ ST=JSON.parse(JSON.stringify(EXEMPLO)); await apiSave(ST); await renderList(); showToast('Exemplo carregado!'); }

// ── APP LAYOUT ────────────────────────────────────────────────────────
function renderApp(viewOnly){
  var app=document.getElementById('app');
  app.innerHTML='<div class="app-layout"><aside class="sidebar" id="sidebar"></aside><main class="main-area" id="mainArea"></main></div>';
  refreshSidebar();
  renderStep(viewOnly);
}
function refreshSidebar(){
  var sb=document.getElementById('sidebar');
  if(!sb||!ST) return;
  var p=totalAnswered();
  var en=empName(ST.empresa);
  var html='<div class="sb-top">';
  html+='<button class="sb-back" onclick="maybeSave()">← Todos os Diagnósticos</button>';
  html+='<div class="sb-title">'+(en?esc(en):'Novo Diagnóstico')+'</div>';
  html+='<div class="sb-prog-bar"><div class="sb-prog-fill" style="width:'+p.pct+'%"></div></div>';
  html+='<div class="sb-prog-label">'+p.ans+'/'+p.total+' respondidas · '+p.pct+'%</div>';
  html+='</div>';
  // ── BOTÃO PRINCIPAL: Gerar Diagnóstico (sempre visível) ──────────
  html+='<div class="sb-generate">';
  html+='<button class="btn-generate" onclick="showResumoPage()">📄 Ver & Gerar Diagnóstico</button>';
  html+='</div>';
  html+='<div class="sb-nav">';
  STEPS.forEach(function(s,i){
    var done=false,partial=false;
    if(s.questions&&ST){
      var a=s.questions.filter(function(q){ return isAnswered(q.id); }).length;
      done=a===s.questions.length&&a>0; partial=a>0&&!done;
    } else if(s.fields&&ST&&ST.empresa){ done=!!(empName(ST.empresa)&&ST.empresa.cnpj); }
    html+='<div class="sb-item'+(i===currentStep?' active':'')+(done?' done':'')+(partial?' partial':'')+'" onclick="goTo('+i+')">';
    html+='<span class="sb-icon">'+s.icon+'</span>';
    html+='<span class="sb-label">'+esc(s.title)+'</span>';
    if(done) html+='<span class="sb-check">✓</span>';
    else if(partial) html+='<span class="sb-dot"></span>';
    html+='</div>';
  });
  html+='</div>';
  // Footer da sidebar
  html+='<div class="sb-footer">';
  html+='<button class="btn-n sm" onclick="saveCurrent();showToast(\'Salvo!\')">💾 Salvar</button>';
  html+='<button class="btn-n sm" onclick="exportJSON()">⬇ JSON</button>';
  html+='</div>';
  sb.innerHTML=html;
  var hpct=document.getElementById('hdrPct');
  if(hpct) hpct.textContent=p.pct+'%';
}

// ── RENDER STEP ───────────────────────────────────────────────────────
function renderStep(viewOnly){
  var s=STEPS[currentStep];
  var ma=document.getElementById('mainArea');
  if(!ma||!s) return;
  var ro=(MODE==='view')||viewOnly;
  var isFirst=currentStep===0, isLast=currentStep===STEPS.length-1;

  var en=ST?empName(ST.empresa):'';
  var html='<div class="step-page">';
  html+='<div class="breadcrumb"><span onclick="route(\'list\')" class="bc-link">Diagnósticos</span> / ';
  html+='<span onclick="goTo(0)" class="bc-link">'+(en?esc(en):'Novo')+'</span> / ';
  html+='<span>'+esc(s.title)+'</span>';
  if(ro) html+='<span class="badge-ro">Visualização</span>';
  html+='</div>';

  html+='<div class="step-heading">';
  html+='<span class="sh-icon">'+s.icon+'</span>';
  html+='<div class="sh-text"><div class="sh-title">'+esc(s.title)+'</div><div class="sh-desc">'+esc(s.desc)+'</div></div>';
  html+='<div class="sh-step">'+(currentStep+1)+' / '+STEPS.length+'</div>';
  html+='</div>';

  if(s.fields) html+=renderEmpresaFields(ro);
  if(s.questions) html+=renderQuestions(s.questions,ro);

  // ── BARRA DE AÇÃO NO RODAPÉ DE CADA ETAPA ────────────────────────
  html+='<div class="step-footer">';
  html+='<div class="step-footer-left">';
  if(!isFirst) html+='<button class="btn-n" onclick="goTo('+(currentStep-1)+')">← Anterior</button>';
  html+='</div>';
  html+='<div class="step-footer-center">';
  // Botão "Ver & Gerar Diagnóstico" sempre no centro
  if(!ro) html+='<button class="btn-n accent" onclick="saveCurrent();showResumoPage()">📄 Ver & Gerar Diagnóstico</button>';
  else html+='<button class="btn-n accent" onclick="showResumoPage()">📄 Ver & Gerar Diagnóstico</button>';
  html+='</div>';
  html+='<div class="step-footer-right">';
  if(!ro){
    html+='<button class="btn-n" onclick="saveCurrent();showToast(\'Salvo!\')" style="margin-right:6px">💾 Salvar</button>';
    if(!isLast) html+='<button class="btn-n primary" onclick="saveCurrent();goTo('+(currentStep+1)+')">Próximo →</button>';
    else html+='<button class="btn-n primary" onclick="saveCurrent();showResumoPage()">Concluir ✓</button>';
  } else {
    html+='<button class="btn-n" onclick="route(\'edit\',ST.id)">✏️ Editar</button>';
    if(!isLast) html+='<button class="btn-n primary" onclick="goTo('+(currentStep+1)+')">Próximo →</button>';
  }
  html+='</div>';
  html+='</div>';

  html+='</div>';
  ma.innerHTML=html;
  scrollToTop();
}

// ── PÁGINA DE RESUMO COMPLETO ─────────────────────────────────────────
function showResumoPage(){
  var ma=document.getElementById('mainArea');
  if(!ma||!ST) return;
  var e=ST.empresa;
  var p=totalAnswered();

  var html='<div class="step-page resumo-page">';

  // ── CABEÇALHO DO RESUMO ──────────────────────────────────────────
  html+='<div class="res-header">';
  html+='<div class="res-header-left">';
  html+='<div class="res-badge">DIAGNÓSTICO COMERCIAL</div>';
  html+='<div class="res-empresa">'+(e.razaoSocial||e.nome||'—')+'</div>';
  html+='<div class="res-meta">';
  if(e.segmento) html+='<span>'+esc(e.segmento)+'</span>';
  if(e.cidade) html+='<span>'+esc(e.cidade+(e.uf?'/'+e.uf:''))+'</span>';
  if(e.data) html+='<span>'+esc(e.data)+'</span>';
  if(e.consultor) html+='<span>Consultor: '+esc(e.consultor)+'</span>';
  html+='</div></div>';
  html+='<div class="res-header-right">';
  html+='<div class="res-pct">'+p.pct+'<span>%</span></div>';
  html+='<div class="res-pct-label">'+p.ans+'/'+p.total+' respondidas</div>';
  html+='</div></div>';

  // ── DADOS DA EMPRESA ─────────────────────────────────────────────
  html+='<div class="res-section">';
  html+='<div class="res-section-title">🏢 Identificação da Empresa</div>';
  html+='<div class="res-grid">';
  var empFields=[
    ['Razão Social',e.razaoSocial||e.nome],['Nome Fantasia',e.nomeFantasia],['CNPJ',e.cnpj],['Inscrição Estadual',e.ie],
    ['Segmento',e.segmento],['ERP',e.erp],
    ['Endereço',e.endereco+(e.bairro?' — '+e.bairro:'')],['Município / UF',e.municipio+(e.uf?' / '+e.uf:'')],
    ['Vendedores PJ',e.vendedoresExternosPJ],['Vendedores CLT ext.',e.vendedoresExternosCLT],
    ['Vendedores internos',e.vendedoresInternos],['Clientes ativos',e.clientes]
  ];
  empFields.forEach(function(row){
    if(!row[1]) return;
    html+='<div class="res-kv"><div class="res-k">'+esc(row[0])+'</div><div class="res-v">'+esc(row[1])+'</div></div>';
  });
  html+='</div>';
  // Participantes
  if(e.participantes&&e.participantes.length){
    html+='<div class="res-participants">';
    html+='<div class="res-k" style="margin-bottom:6px">Participantes da reunião</div>';
    html+='<div class="res-parts-grid">';
    e.participantes.forEach(function(p){
      if(!p.nome) return;
      html+='<div class="res-part"><span class="res-part-area">'+esc(p.area||'—')+'</span><span class="res-part-name">'+esc(p.nome)+'</span><span class="res-part-cargo">'+esc(p.cargo||'')+'</span></div>';
    });
    html+='</div></div>';
  }
  html+='</div>';

  // ── BLOCOS DE PERGUNTAS ──────────────────────────────────────────
  STEPS.forEach(function(s){
    if(!s.questions) return;
    var answered=s.questions.filter(function(q){ return isAnswered(q.id); });
    var total=s.questions.length;
    var pct=Math.round(answered.length/total*100);
    var colr=pct===100?'var(--green)':pct>60?'#B7770D':'var(--red)';

    html+='<div class="res-section">';
    html+='<div class="res-section-title">';
    html+=s.icon+' '+esc(s.title);
    html+='<span class="res-bloco-pct" style="color:'+colr+'">'+answered.length+'/'+total+'</span>';
    html+='</div>';

    // tabela de respostas
    html+='<div class="res-qa-list">';
    s.questions.forEach(function(q,qi){
      if(q.tipo==='file') return; // pular uploads
      var val=ST.respostas[q.id];
      var obs=ST.obs[q.id]||'';
      var hasVal=isAnswered(q.id);
      var isAlta=q.crit==='ALTA';

      html+='<div class="res-qa-row'+(isAlta?' res-qa-alta':'')+(hasVal?' res-qa-answered':' res-qa-empty')+'">';
      html+='<div class="res-qa-left">';
      html+='<div class="res-qa-num">'+(qi+1)+'</div>';
      html+='</div>';
      html+='<div class="res-qa-body">';
      html+='<div class="res-qa-q">'+esc(q.q);
      if(isAlta) html+='<span class="res-crit">ALTA</span>';
      html+='</div>';

      if(hasVal){
        if(q.tipo==='yn'){
          html+='<div class="res-qa-a res-yn '+(val==='Sim'?'res-sim':'res-nao')+'">'+esc(val)+'</div>';
        } else if(q.tipo==='multi'){
          var sel=Array.isArray(val)?val:[];
          html+='<div class="res-qa-a res-chips-ro">';
          sel.forEach(function(v){ html+='<span class="res-chip">'+esc(v)+'</span>'; });
          html+='</div>';
        } else if(q.tipo==='docs_obrig'){
          html+='<div class="res-qa-a res-docs-ro">';
          var dv=typeof val==='object'&&!Array.isArray(val)?val:{};
          Object.entries(dv).forEach(function(kv){
            var status=kv[1];
            var cls=status==='Obrigatório'?'res-doc-obrig':status==='Opcional'?'res-doc-opc':'res-doc-no';
            html+='<span class="res-doc '+cls+'"><b>'+esc(kv[0])+':</b> '+esc(status)+'</span>';
          });
          html+='</div>';
        } else if(q.tipo==='cond_pagamento'){
          var rows=Array.isArray(val)?val:[];
          if(rows.length){
            html+='<div class="res-qa-a"><table class="res-cond-table"><tr><th>Condição</th><th>Desconto</th><th>Obs</th></tr>';
            rows.forEach(function(r){ if(r.cond||r.desc) html+='<tr><td>'+esc(r.cond||'—')+'</td><td>'+esc(r.desc||'—')+'</td><td>'+esc(r.obs||'')+'</td></tr>'; });
            html+='</table></div>';
          }
        } else {
          html+='<div class="res-qa-a">'+esc(valToStr(val))+'</div>';
        }
      } else {
        html+='<div class="res-qa-a res-empty-a">Não respondida</div>';
      }

      if(obs) html+='<div class="res-qa-obs">📝 '+esc(obs)+'</div>';
      html+='</div></div>'; // body + row
    });
    html+='</div>'; // qa-list
    html+='</div>'; // section
  });

  // ── AÇÕES FINAIS ─────────────────────────────────────────────────
  html+='<div class="res-actions">';
  html+='<button class="btn-n primary lg" id="btnGerar" onclick="gerarDoc(event)">📄 Baixar Documento Word (.docx)</button>';
  html+='<button class="btn-n lg" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>';
  html+='<button class="btn-n" onclick="exportJSON()">⬇ Exportar JSON</button>';
  html+='<button class="btn-n" onclick="goTo(0)">✏️ Continuar Editando</button>';
  html+='</div>';

  html+='</div>';
  ma.innerHTML=html;
  scrollToTop();

  // atualizar sidebar: desativar item ativo
  document.querySelectorAll('.sb-item').forEach(function(el){ el.classList.remove('active'); });
}

// ── EMPRESA ──────────────────────────────────────────────────────────
function renderEmpresaFields(ro){
  var e=ST.empresa;
  function nf(lbl,key,ph,hint,span,extra,req){
    var id='ef-'+key;
    var val=e[key]||'';
    var html='<div class="n-field-group'+(span?' '+span:'')+'">';
    html+='<div class="n-field-label">'+esc(lbl);
    if(req) html+='<span class="req"> *</span>';
    if(hint) html+=' <span class="n-hint">'+esc(hint)+'</span>';
    html+='</div>';
    if(ro) html+='<div class="n-ro">'+(val||'—')+'</div>';
    else html+='<input type="text" id="'+id+'" class="n-input" value="'+esc(val)+'" placeholder="'+esc(ph||'')+'" '+(extra||'')+' oninput="ST.empresa[\''+key+'\']=this.value;refreshSidebar();triggerAutoSave()" />';
    html+='</div>';
    return html;
  }
  var html='<div class="notion-block">';
  html+='<div class="n-sec">Dados Fiscais</div>';
  html+='<div class="n-row">';
  html+=nf('CNPJ','cnpj','Ex: 12.345.678/0001-90','Alfanumérico. Busca dados na Receita Federal ao digitar.','',ro?'':'onchange="buscaCNPJ(this.value)"',true);
  html+=nf('Inscrição Estadual','ie','Ex: 123.456.789.000','');
  html+='</div>';
  html+='<div id="cnpjStatus"></div>';
  html+='<div class="n-row">';
  html+=nf('Razão Social','razaoSocial','Ex: Distribuidora Alimentos Norte S.A.','Preenchido automaticamente pelo CNPJ.','full','',true);
  html+='</div>';
  html+='<div class="n-row">';
  html+=nf('Nome Fantasia','nomeFantasia','Ex: Dist. Alimentos Norte','');
  html+=nf('Setor / Segmento','segmento','Ex: Distribuição de Alimentos, Indústria Têxtil...','');
  html+='</div>';
  html+='<div class="n-sec" style="margin-top:16px">Endereço</div>';
  html+='<div class="n-row">';
  html+=nf('CEP','cep','Ex: 69000-000','','' ,ro?'':'onchange="buscaCEP(this.value)"');
  html+=nf('Endereço','endereco','Ex: Av. Djalma Batista, 1500','','span2');
  html+='</div>';
  html+='<div class="n-row">';
  html+=nf('Bairro','bairro','Ex: Chapada','');
  html+=nf('Município','municipio','Ex: Manaus','');
  html+=nf('Cidade','cidade','Ex: Manaus','');
  html+=nf('UF','uf','Ex: AM','');
  html+='</div>';
  html+='<div class="n-sec" style="margin-top:16px">Sobre a Empresa</div>';
  html+='<div class="n-row">';
  html+=nf('ERP Utilizado','erp','Ex: TOTVS Protheus, SAP, Sankhya, Bling, Omie...','');
  html+=nf('Nº Vendedores Externos PJ','vendedoresExternosPJ','Ex: 8','Representantes PJ.');
  html+=nf('Nº Vendedores Externos CLT','vendedoresExternosCLT','Ex: 5','Vendedores ext. CLT.');
  html+=nf('Nº Vendedores Internos','vendedoresInternos','Ex: 4','Inside Sales / Televendas.');
  html+=nf('Nº Clientes Ativos','clientes','Ex: 620','Compraram nos últimos 90 dias.');
  html+='</div>';
  html+='<div class="n-sec" style="margin-top:16px">Reunião</div>';
  html+='<div class="n-row">';
  html+=nf('Data do Diagnóstico','data','Ex: 15/03/2025','');
  html+=nf('Consultor Responsável','consultor','Ex: Carlos Mendes','');
  html+='</div>';
  // Participantes
  html+='<div class="n-field-group full" style="margin-top:4px">';
  html+='<div class="n-field-label">Participantes da Reunião <span class="n-hint">Inclua obrigatoriamente TI, Financeiro e Comercial.</span></div>';
  html+='<div id="participantsList">'+renderParticipants(e.participantes||[],ro)+'</div>';
  if(!ro) html+='<button class="btn-add-row" onclick="addParticipante()">+ Adicionar participante</button>';
  html+='</div>';
  html+='</div>';
  return html;
}

function renderParticipants(parts,ro){
  var areas=['Comercial','Financeiro','TI','Operações','Diretoria','Outro'];
  if(parts.length===0&&!ro){
    parts=[{nome:'',cargo:'',area:'Comercial'},{nome:'',cargo:'',area:'Financeiro'},{nome:'',cargo:'',area:'TI'}];
    ST.empresa.participantes=parts;
  }
  return parts.map(function(p,i){
    var aops=areas.map(function(a){ return '<option'+(p.area===a?' selected':'')+'>'+a+'</option>'; }).join('');
    var fixed=i<3;
    return '<div class="part-row">'+
      '<input class="n-input" placeholder="Nome completo" value="'+esc(p.nome||'')+'" '+(ro?'disabled':'')+' oninput="updateParticipante('+i+',\'nome\',this.value)"/>'+
      '<input class="n-input" placeholder="Cargo" value="'+esc(p.cargo||'')+'" '+(ro?'disabled':'')+' oninput="updateParticipante('+i+',\'cargo\',this.value)"/>'+
      '<select class="n-select" '+(ro?'disabled':'')+' onchange="updateParticipante('+i+',\'area\',this.value)">'+aops+'</select>'+
      (!ro&&!fixed?'<button class="remove-row" onclick="removeParticipante('+i+')">✕</button>':'<span style="width:24px"></span>')+
      '</div>';
  }).join('');
}
function addParticipante(){ if(!ST.empresa.participantes) ST.empresa.participantes=[]; ST.empresa.participantes.push({nome:'',cargo:'',area:'Outro'}); var el=document.getElementById('participantsList'); if(el) el.innerHTML=renderParticipants(ST.empresa.participantes,false); triggerAutoSave(); }
function removeParticipante(i){ ST.empresa.participantes.splice(i,1); var el=document.getElementById('participantsList'); if(el) el.innerHTML=renderParticipants(ST.empresa.participantes,false); triggerAutoSave(); }
function updateParticipante(i,f,v){ if(!ST.empresa.participantes[i]) ST.empresa.participantes[i]={}; ST.empresa.participantes[i][f]=v; triggerAutoSave(); }

function buscaCNPJ(val){
  var cnpj=val.replace(/\D/g,'');
  if(cnpj.length!==14) return;
  var st=document.getElementById('cnpjStatus');
  if(st) st.innerHTML='<div class="cnpj-loading">🔍 Consultando Receita Federal...</div>';
  fetch('https://brasilapi.com.br/api/cnpj/v1/'+cnpj)
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.razao_social){
        ST.empresa.razaoSocial=d.razao_social||'';
        ST.empresa.nomeFantasia=d.nome_fantasia||d.razao_social||'';
        ST.empresa.segmento=ST.empresa.segmento||d.cnae_fiscal_descricao||'';
        ST.empresa.cep=(d.cep||'').replace(/\D/g,'');
        ST.empresa.endereco=(d.logradouro||'')+(d.numero?' '+d.numero:'');
        ST.empresa.bairro=d.bairro||'';
        ST.empresa.municipio=d.municipio||'';
        ST.empresa.cidade=d.municipio||'';
        ST.empresa.uf=d.uf||'';
        if(st) st.innerHTML='<div class="cnpj-ok">✓ '+esc(d.razao_social)+'</div>';
        triggerAutoSave();
        renderStep(MODE==='view');
      } else {
        if(st) st.innerHTML='<div class="cnpj-error">⚠️ CNPJ não encontrado.</div>';
      }
    })
    .catch(function(){ if(st) st.innerHTML='<div class="cnpj-error">⚠️ Erro na consulta (verifique conexão).</div>'; });
}

// ── PERGUNTAS ─────────────────────────────────────────────────────────
function renderQuestions(qs,ro){
  return '<div class="questions-list">'+qs.map(function(q,i){ return renderQCard(q,i,ro); }).join('')+'</div>';
}
function renderQCard(q,qi,ro){
  var ans=isAnswered(q.id);
  var isAlta=q.crit==='ALTA';
  return '<div class="q-card'+(ans?' answered':'')+(isAlta?' critical':'')+'" id="qc-'+q.id+'">'+
    '<div class="q-top"><div class="q-num">'+(qi+1)+'</div>'+
    '<div class="q-body"><div class="q-text">'+esc(q.q)+'</div>'+
    (q.hint?'<div class="q-hint">💡 '+esc(q.hint)+'</div>':'')+
    '<div class="q-tags">'+(isAlta?'<span class="qtag alta">Alta criticidade</span>':'')+'<span class="qtag tipo">'+tipoLbl(q.tipo)+'</span>'+(ans?'<span class="qtag done">✓</span>':'')+'</div>'+
    '</div></div>'+
    '<div class="q-answer">'+renderAnswer(q,ro)+
    '<div class="obs-wrap">'+(ro?(ST.obs[q.id]?'<div class="obs-ro"><span class="obs-lbl">📝</span> '+esc(ST.obs[q.id])+'</div>':''):'<textarea class="obs-textarea" placeholder="📝 Observação — exceções, contexto adicional, regras específicas..." oninput="ST.obs[\''+q.id+'\']=this.value">'+esc(ST.obs[q.id]||'')+'</textarea>')+
    '</div></div></div>';
}
function renderAnswer(q,ro){
  var val=ST.respostas[q.id];
  if(q.tipo==='yn'){
    if(ro) return '<div class="ans-ro '+(val==='Sim'?'ans-sim':val==='Não'?'ans-nao':'')+'">'+(val||'—')+'</div>';
    var y=val==='Sim',n=val==='Não';
    return '<div class="yn-row"><button class="yn-btn'+(y?' yes':'') +'" onclick="setR(\''+q.id+'\',\'Sim\')">✓ Sim</button><button class="yn-btn nao'+(n?' no':'')+'" onclick="setR(\''+q.id+'\',\'Não\')">✕ Não</button></div>';
  }
  if(q.tipo==='single'){
    if(ro) return '<div class="ans-ro">'+(val||'—')+'</div>';
    return '<div class="chips">'+q.opts.map(function(o){ return '<button class="chip'+(val===o?' sel':'')+'" onclick="setR(\''+q.id+'\',\''+esc(o)+'\')">'+esc(o)+'</button>'; }).join('')+'</div>';
  }
  if(q.tipo==='multi'){
    var sel=Array.isArray(val)?val:[];
    if(ro) return '<div class="ans-ro">'+(sel.length?sel.map(esc).join(', '):'—')+'</div>';
    return '<div class="chips">'+q.opts.map(function(o){ return '<button class="chip multi'+(sel.indexOf(o)>=0?' sel':'')+'" onclick="toggleM(\''+q.id+'\',\''+esc(o)+'\')">'+esc(o)+'</button>'; }).join('')+'</div>';
  }
  if(q.tipo==='text'){
    if(ro) return '<div class="ans-ro">'+(val||'—')+'</div>';
    return '<input type="text" class="n-input" value="'+esc(val||'')+'" placeholder="'+esc(q.ph||'Digite aqui...')+'" onchange="setR(\''+q.id+'\',this.value)" />';
  }
  if(q.tipo==='textarea'){
    if(ro) return '<div class="ans-ro" style="white-space:pre-wrap">'+(val||'—')+'</div>';
    return '<textarea class="n-textarea" placeholder="'+esc(q.ph||'Descreva aqui...')+'" onchange="setR(\''+q.id+'\',this.value)">'+esc(val||'')+'</textarea>';
  }
  if(q.tipo==='file'){
    var anexo=ST.anexos&&ST.anexos[q.id];
    if(ro) return '<div class="ans-ro">'+(anexo?'📎 '+esc(anexo.name):'—')+'</div>';
    return '<div class="file-drop">'+(anexo?'<div class="file-attached">📎 '+esc(anexo.name)+' <button onclick="removeFile(\''+q.id+'\')">✕</button></div>':'<label class="file-label"><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" onchange="handleFile(\''+q.id+'\',this)" style="display:none"/>📎 Clique para anexar ou arraste o arquivo aqui<br/><small>PDF, Word, Excel, Imagem</small></label>')+'</div>';
  }
  if(q.tipo==='docs_obrig'){
    var dv=(val&&typeof val==='object'&&!Array.isArray(val))?val:{};
    if(ro){
      if(!Object.keys(dv).length) return '<div class="ans-ro">—</div>';
      return '<div class="docs-ro">'+q.opts.map(function(o){ var s=dv[o]||'—'; return '<div class="docs-ro-row"><span>'+esc(o)+'</span><span class="docs-s '+s.toLowerCase().replace(' ','_')+'">'+s+'</span></div>'; }).join('')+'</div>';
    }
    return '<div class="docs-table"><div class="docs-hdr"><span>Documento</span><span>Status</span></div>'+
      q.opts.map(function(o){ var cur=dv[o]||'';
        return '<div class="docs-row"><span class="docs-name">'+esc(o)+'</span><div class="docs-opts">'+
          ['Obrigatório','Opcional','Não exigido'].map(function(s){ return '<button class="chip docs-chip'+(cur===s?' sel':'')+'" onclick="setDocsObrig(\''+q.id+'\',\''+esc(o)+'\',\''+s+'\')">'+s+'</button>'; }).join('')+
          '</div></div>';
      }).join('')+'</div>';
  }
  if(q.tipo==='cond_pagamento'){
    var condVal=Array.isArray(val)?val:[];
    if(ro){
      if(!condVal.length) return '<div class="ans-ro">—</div>';
      return '<table class="res-cond-table"><tr><th>Condição</th><th>Desconto</th><th>Obs</th></tr>'+condVal.map(function(r){ return '<tr><td>'+esc(r.cond||'')+'</td><td>'+esc(r.desc||'')+'</td><td>'+esc(r.obs||'')+'</td></tr>'; }).join('')+'</table>';
    }
    return '<div class="cond-editor" id="cond-'+q.id+'">'+
      '<div class="cond-hdr"><span>Condição</span><span>Desconto (%)</span><span>Observação</span><span></span></div>'+
      (condVal.length?condVal:[{cond:'',desc:'',obs:''}]).map(function(r,ri){ return renderCondRow(q.id,ri,r); }).join('')+
      '</div><button class="btn-add-row" onclick="addCondRow(\''+q.id+'\')">+ Adicionar condição</button>';
  }
  return '';
}
function renderCondRow(qid,ri,r){
  return '<div class="cond-row" id="crow-'+qid+'-'+ri+'">'+
    '<input class="n-input" value="'+esc(r.cond||'')+'" placeholder="Ex: 28 DDL" onchange="updateCond(\''+qid+'\','+ri+',\'cond\',this.value)"/>'+
    '<input class="n-input" value="'+esc(r.desc||'')+'" placeholder="Ex: 0%" onchange="updateCond(\''+qid+'\','+ri+',\'desc\',this.value)"/>'+
    '<input class="n-input" value="'+esc(r.obs||'')+'" placeholder="Ex: Padrão clientes B" onchange="updateCond(\''+qid+'\','+ri+',\'obs\',this.value)"/>'+
    '<button class="remove-row" onclick="removeCondRow(\''+qid+'\','+ri+')">✕</button></div>';
}
function addCondRow(qid){ var val=Array.isArray(ST.respostas[qid])?ST.respostas[qid]:[]; val.push({cond:'',desc:'',obs:''}); ST.respostas[qid]=val; var ce=document.getElementById('cond-'+qid); if(ce){ var d=document.createElement('div'); d.className='cond-row'; d.id='crow-'+qid+'-'+(val.length-1); var tmp=document.createElement('div'); tmp.innerHTML=renderCondRow(qid,val.length-1,{cond:'',desc:'',obs:''}); d.innerHTML=tmp.firstChild.innerHTML; ce.appendChild(d); } }
function removeCondRow(qid,ri){ var val=Array.isArray(ST.respostas[qid])?ST.respostas[qid]:[]; val.splice(ri,1); ST.respostas[qid]=val; var ce=document.getElementById('cond-'+qid); if(ce){ var rows=ce.querySelectorAll('.cond-row'); if(rows[ri]) rows[ri].remove(); } }
function updateCond(qid,ri,f,v){ if(!Array.isArray(ST.respostas[qid])) ST.respostas[qid]=[]; while(ST.respostas[qid].length<=ri) ST.respostas[qid].push({cond:'',desc:'',obs:''}); ST.respostas[qid][ri][f]=v; refreshQCard(qid); }
function setDocsObrig(qid,doc,status){ var val=(ST.respostas[qid]&&typeof ST.respostas[qid]==='object'&&!Array.isArray(ST.respostas[qid]))?ST.respostas[qid]:{}; val[doc]=status; ST.respostas[qid]=val; refreshQCard(qid); }
function handleFile(qid,input){ var file=input.files[0]; if(!file) return; var reader=new FileReader(); reader.onload=function(e){ if(!ST.anexos) ST.anexos={}; ST.anexos[qid]={name:file.name,type:file.type,data:e.target.result}; ST.respostas[qid]=file.name; refreshQCard(qid); }; reader.readAsDataURL(file); }
function removeFile(qid){ if(ST.anexos) delete ST.anexos[qid]; delete ST.respostas[qid]; refreshQCard(qid); }

// ── STATE ────────────────────────────────────────────────────────────
var _saveTimeout=null;
function triggerAutoSave(){ clearTimeout(_saveTimeout); _saveTimeout=setTimeout(function(){ saveCurrent(); },2000); }
function setR(id,val){ ST.respostas[id]=val; refreshQCard(id); refreshSidebar(); triggerAutoSave(); }
function toggleM(id,opt){ var sel=Array.isArray(ST.respostas[id])?ST.respostas[id].slice():[]; var i=sel.indexOf(opt); if(i>=0) sel.splice(i,1); else sel.push(opt); ST.respostas[id]=sel; refreshQCard(id); refreshSidebar(); triggerAutoSave(); }
function refreshQCard(id){
  var s=STEPS[currentStep]; if(!s||!s.questions) return;
  var q=s.questions.find(function(x){ return x.id===id; }); if(!q) return;
  var idx=s.questions.indexOf(q);
  var card=document.getElementById('qc-'+id); if(!card) return;
  card.outerHTML=renderQCard(q,idx,MODE==='view');
}
function exportJSON(){ var b=new Blob([JSON.stringify(ST,null,2)],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='diagnostico_'+((ST.empresa.nome||'empresa').replace(/\s+/g,'_'))+'.json'; a.click(); showToast('JSON exportado!'); }

// ── GERAÇÃO DOCX ─────────────────────────────────────────────────────
function gerarDoc(evt){
  var btn=document.getElementById('btnGerar');
  if(btn){btn.disabled=true;btn.textContent='⏳ Gerando...';}
  try{
    var D=window.docx,E=ST.empresa,today=E.data||new Date().toLocaleDateString('pt-BR');
    var NAVY='0F1F3D',BLUE='1E3A6E',GOLD='C9A84C',BL='EFF6FF',GR='F7F8FA';
    var RED='C0392B',GRN='1a7a45',WHT='FFFFFF',MUT='6B7280',DARK='111827';
    function b1(c){return {style:D.BorderStyle.SINGLE,size:1,color:c||'DDDDDD'};}
    function brd(c){var b=b1(c);return {top:b,bottom:b,left:b,right:b};}
    function noB(){var b={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};return {top:b,bottom:b,left:b,right:b};}
    function sh(f){return {fill:f,type:D.ShadingType.CLEAR};}
    function tc(w,f,bdr,ch,ex){ var o={width:{size:w,type:D.WidthType.DXA},shading:sh(f),borders:bdr||brd('DDDDDD'),margins:{top:80,bottom:80,left:120,right:120},children:ch}; if(ex) Object.assign(o,ex); return new D.TableCell(o); }
    function tr(cells){return new D.TableRow({children:cells});}
    function p(text,opts){ var o=opts||{}; return new D.Paragraph({spacing:{before:o.b||60,after:o.a||80},alignment:o.al||D.AlignmentType.LEFT,children:[new D.TextRun({text:String(text||''),size:o.sz||20,color:o.co||DARK,bold:!!o.bld,italic:!!o.it,font:'Arial'})]}); }
    function h1(t){ return new D.Paragraph({spacing:{before:480,after:160},border:{bottom:{style:D.BorderStyle.SINGLE,size:8,color:GOLD,space:6}},children:[new D.TextRun({text:t,bold:true,size:34,color:NAVY,font:'Arial'})]}); }
    function h2(t){ return new D.Paragraph({spacing:{before:280,after:80},children:[new D.TextRun({text:t,bold:true,size:24,color:BLUE,font:'Arial'})]}); }
    function sp(n){var r=[];for(var i=0;i<(n||1);i++) r.push(new D.Paragraph({spacing:{before:0,after:0},children:[new D.TextRun({text:'',size:16})]}));return r;}
    function pb(){return new D.Paragraph({children:[new D.PageBreak()],spacing:{before:0,after:0}});}
    function nb2(){var b={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};return {bottom:b,top:b,left:b,right:b,insideH:b,insideV:b};}

    var parts=(E.participantes||[]).filter(function(p){return p.nome;}).map(function(p){return (p.area?'['+p.area+'] ':'')+p.nome+(p.cargo?' — '+p.cargo:'');}).join('\n');
    var cover=[
      new D.Paragraph({spacing:{before:1800,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:'DIAGNÓSTICO COMERCIAL',bold:true,size:68,color:NAVY,font:'Arial'})]}),
      new D.Paragraph({spacing:{before:100,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:'Política Comercial · Força de Vendas · CRM · Gestão Comercial',size:24,color:MUT,font:'Arial',italic:true})]}),
      new D.Paragraph({spacing:{before:800,after:0},border:{bottom:{style:D.BorderStyle.SINGLE,size:12,color:GOLD,space:4}},children:[]})
    ].concat(sp(2)).concat([
      new D.Paragraph({spacing:{before:400,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:E.razaoSocial||E.nome||'Empresa',bold:true,size:42,color:NAVY,font:'Arial'})]}),
      new D.Paragraph({spacing:{before:80,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:(E.nomeFantasia&&E.nomeFantasia!==E.razaoSocial?E.nomeFantasia+' · ':'')+E.segmento,size:22,color:MUT,font:'Arial'})]}),
      new D.Paragraph({spacing:{before:40,after:0},alignment:D.AlignmentType.CENTER,children:[new D.TextRun({text:E.municipio+(E.uf?' / '+E.uf:'')+( E.cidade&&E.cidade!==E.municipio?' ('+E.cidade+')':''),size:20,color:MUT,font:'Arial'})]})
    ]).concat(sp(6)).concat([
      new D.Table({width:{size:7200,type:D.WidthType.DXA},alignment:D.AlignmentType.CENTER,columnWidths:[2800,4400],
        rows:[['Data do Diagnóstico',today],['Consultor Responsável',E.consultor||'—'],['CNPJ',E.cnpj||'—'],['Inscrição Estadual',E.ie||'—'],['ERP Utilizado',E.erp||'—'],['Vendedores Ext. PJ','Ext. PJ: '+(E.vendedoresExternosPJ||'—')+' · Ext. CLT: '+(E.vendedoresExternosCLT||'—')+' · Internos: '+(E.vendedoresInternos||'—')],['Clientes Ativos',E.clientes||'—'],['Participantes',parts||'—']]
          .map(function(row,i){var bg=i%2===0?GR:WHT;return tr([tc(2800,NAVY,brd(NAVY),[p(row[0],{co:WHT,bld:true,sz:18})]),tc(4400,bg,brd('DDDDDD'),[p(row[1],{sz:18})])]);})
      }),pb()
    ]);

    var pctG=totalAnswered().pct;
    var resumo=[h1('Resumo Executivo'),p('Diagnóstico de política comercial realizado com a equipe da empresa. Serve como base de referência para parametrização e implantação das plataformas de Força de Vendas, CRM e Gestão Comercial.',{sz:20})].concat(sp(1)).concat([
      new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[5000,4360],
        rows:[tr([tc(5000,NAVY,brd(NAVY),[p('Indicador',{co:WHT,bld:true})]),tc(4360,NAVY,brd(NAVY),[p('Resultado',{co:WHT,bld:true,al:D.AlignmentType.CENTER})])])].concat(
          [['Preenchimento geral',pctG+'%'],['Vendedores Ext. PJ',(E.vendedoresExternosPJ||'—')],['Vendedores Ext. CLT',(E.vendedoresExternosCLT||'—')],['Vendedores Internos',(E.vendedoresInternos||'—')],['Clientes ativos',(E.clientes||'—')],['ERP',(E.erp||'—')]].map(function(row,i){var bg=i%2===0?GR:WHT;return tr([tc(5000,bg,brd('DDDDDD'),[p(row[0],{co:NAVY})]),tc(4360,bg,brd('DDDDDD'),[p(row[1],{co:NAVY,bld:true,al:D.AlignmentType.CENTER})])]);})
        )})
    ]).concat(sp(2)).concat([pb()]);

    var blocoSecs=[];
    STEPS.forEach(function(s){
      if(!s.questions) return;
      var ans2=s.questions.filter(function(q){return isAnswered(q.id);}).length;
      blocoSecs.push(h1(s.icon+'  '+s.title));
      blocoSecs.push(p(s.desc,{co:MUT,it:true,sz:19}));
      blocoSecs.push(p(ans2+' de '+s.questions.length+' perguntas respondidas.',{co:MUT,it:true,sz:18,b:0,a:80}));
      var hRow=tr([tc(140,NAVY,brd(NAVY),[p('')]),tc(60,NAVY,brd(NAVY),[p('',{co:WHT})]),tc(4400,NAVY,brd(NAVY),[p('Pergunta',{co:WHT,bld:true,sz:18})]),tc(4760,NAVY,brd(NAVY),[p('Resposta Coletada',{co:WHT,bld:true,sz:18})])]);
      var qRows=[];
      s.questions.forEach(function(q,i){
        if(q.tipo==='file') return;
        var val=ST.respostas[q.id],obs=ST.obs[q.id]||'';
        var valStr='Não respondido';
        if(Array.isArray(val)&&val.length){
          if(typeof val[0]==='object') valStr=val.map(function(r){return (r.cond||'')+(r.desc?' → '+r.desc:'')+(r.obs?' ('+r.obs+')':'');}).filter(Boolean).join(' · ');
          else valStr=val.join(' · ');
        } else if(val&&typeof val==='object'&&!Array.isArray(val)){
          valStr=Object.entries(val).map(function(kv){return kv[0]+': '+kv[1];}).join(' | ');
        } else if(val) valStr=String(val);
        var hasV=isAnswered(q.id);
        var bg=i%2===0?GR:WHT;
        var cc=q.crit==='ALTA'?RED:q.crit==='MEDIA'?'B7770D':GRN;
        qRows.push(tr([
          tc(140,cc,brd('FFFFFF'),[p('')]),
          tc(60,hasV?'E8F5EE':'FEF2F2',brd('EEEEEE'),[p(hasV?'✓':'—',{co:hasV?GRN:RED,al:D.AlignmentType.CENTER,sz:18})]),
          tc(4400,bg,brd('DDDDDD'),[p((i+1)+'. '+q.q,{co:NAVY,sz:19}),p(tipoLbl(q.tipo)+' · Criticidade '+(q.crit||'Média'),{co:MUT,it:true,sz:15,b:0,a:0})]),
          tc(4760,hasV?WHT:'FFF9F9',brd('DDDDDD'),[p(valStr,{co:hasV?NAVY:'AAAAAA',bld:hasV,sz:20})])
        ]));
        if(obs){
          var oc=new D.TableCell({columnSpan:3,width:{size:9220,type:D.WidthType.DXA},shading:sh('FFFBEB'),borders:brd('DDDDDD'),margins:{top:60,bottom:60,left:160,right:120},children:[new D.Paragraph({children:[new D.TextRun({text:'📝 Obs: ',bold:true,size:17,color:'92400E',font:'Arial'}),new D.TextRun({text:obs,size:17,color:'78350F',italic:true,font:'Arial'})]})]});
          qRows.push(tr([tc(140,'FFFBEB',brd('DDDDDD'),[p('')]),oc]));
        }
      });
      if(qRows.length) blocoSecs.push(new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[140,60,4400,4760],rows:[hRow].concat(qRows)}));
      blocoSecs=blocoSecs.concat(sp(1));
    });
    blocoSecs.push(pb());

    var params=[['Clientes','Campos obrigatórios de cadastro'],['Clientes','Documentos e obrigatoriedade por tipo'],['Crédito','Prazo de reativação para nova análise'],['Crédito','Bloqueio automático por inadimplência'],['Frete','Valor mínimo CIF / percentual FOB / redespacho'],['Preço','Preço mínimo por produto'],['Preço','Preço ideal (target) por produto'],['Preço','Tabelas de preço por perfil de vendedor e segmento'],['Pagamento','Condições permitidas por perfil / tabela de condições'],['Pagamento','Prazo médio por cliente'],['Comissão','Base de cálculo e percentual por linha / produto'],['Estoque','Visibilidade de estoque por filial/CD e perfil'],['Estoque','Múltiplos de embalagem por produto'],['Bonificação','Regra de cashback sobre margem extra'],['Aprovações','Níveis de alçada, limites e responsáveis'],['Aprovações','Gatilhos de aprovação automática']];
    var pHdr=tr([tc(2000,NAVY,brd(NAVY),[p('Módulo',{co:WHT,bld:true})]),tc(5360,NAVY,brd(NAVY),[p('Regra / Parametrização',{co:WHT,bld:true})]),tc(2000,NAVY,brd(NAVY),[p('Status',{co:WHT,bld:true})])]);
    var pRows=params.map(function(row,i){var bg=i%2===0?BL:WHT;return tr([tc(2000,bg,brd('DDDDDD'),[p(row[0],{co:BLUE,bld:true})]),tc(5360,bg,brd('DDDDDD'),[p(row[1])]),tc(2000,bg,brd('DDDDDD'),[p('⬜ Pendente',{co:MUT,al:D.AlignmentType.CENTER})])]);});
    var steps2=['Revisão e validação interna das respostas com equipe','Priorização: Quick Wins vs. Iniciativas Estratégicas de médio prazo','Aprovação formal do fluxo de alçadas e responsáveis','Configuração inicial: tabelas de preço, condições de pagamento e perfis','Homologação com usuários-chave: gerente comercial, financeiro e TI','Treinamento da equipe comercial e go-live faseado por módulo'];
    var sRows=steps2.map(function(s,i){return tr([tc(800,i%2===0?GOLD:'C4973A',brd('CCCCCC'),[p(String(i+1),{co:NAVY,bld:true,al:D.AlignmentType.CENTER})]),tc(8560,i%2===0?GR:WHT,brd('DDDDDD'),[p(s,{co:NAVY,sz:20})])]);});
    var paramSec=[h1('Parametrizações Recomendadas'),p('Lista consolidada de regras a configurar na plataforma com base nas informações levantadas neste diagnóstico. Este documento é a base de referência para a equipe de implantação.',{sz:20})].concat(sp(1)).concat([new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[2000,5360,2000],rows:[pHdr].concat(pRows)})]).concat(sp(2)).concat([pb()]);
    var nextSec=[h1('Próximos Passos'),new D.Table({width:{size:9360,type:D.WidthType.DXA},columnWidths:[800,8560],rows:sRows})].concat(sp(3)).concat([new D.Paragraph({spacing:{before:400,after:0},border:{top:{style:D.BorderStyle.SINGLE,size:2,color:'DDDDDD',space:8}},children:[new D.TextRun({text:'Gerado em '+today+' · Consultor: '+(E.consultor||'—')+' · Documento Confidencial',size:16,color:MUT,italic:true,font:'Arial'})]})]);

    var hc1=new D.TableCell({width:{size:6200,type:D.WidthType.DXA},borders:noB(),margins:{top:60,bottom:60,left:0,right:0},children:[new D.Paragraph({children:[new D.TextRun({text:'DIAGNÓSTICO COMERCIAL  |  ',bold:true,size:18,color:NAVY,font:'Arial'}),new D.TextRun({text:E.razaoSocial||E.nome||'Empresa',size:18,color:MUT,font:'Arial'})]})]});
    var hc2=new D.TableCell({width:{size:3438,type:D.WidthType.DXA},borders:noB(),margins:{top:60,bottom:60,left:0,right:0},children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT,children:[new D.TextRun({text:today,size:18,color:MUT,font:'Arial'})]})]});
    var nbb2={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};
    var hdrObj=new D.Header({children:[new D.Table({width:{size:9638,type:D.WidthType.DXA},columnWidths:[6200,3438],rows:[tr([hc1,hc2])],borders:{bottom:{style:D.BorderStyle.SINGLE,size:4,color:GOLD,space:4},top:nbb2,left:nbb2,right:nbb2,insideH:nbb2,insideV:nbb2}})]});
    var fc1=new D.TableCell({width:{size:7000,type:D.WidthType.DXA},borders:noB(),children:[new D.Paragraph({children:[new D.TextRun({text:'Documento Confidencial · Base de Implantação · DiagComercial',size:16,color:MUT,italic:true,font:'Arial'})]})]});
    var fc2=new D.TableCell({width:{size:2638,type:D.WidthType.DXA},borders:noB(),children:[new D.Paragraph({alignment:D.AlignmentType.RIGHT,children:[new D.TextRun({text:'Página ',size:16,color:MUT,font:'Arial'}),new D.TextRun({children:[new D.PageNumber()],size:16,color:MUT,font:'Arial'})]})]});
    var ftrObj=new D.Footer({children:[new D.Table({width:{size:9638,type:D.WidthType.DXA},columnWidths:[7000,2638],rows:[tr([fc1,fc2])],borders:{top:{style:D.BorderStyle.SINGLE,size:2,color:'DDDDDD',space:4},bottom:nbb2,left:nbb2,right:nbb2,insideH:nbb2,insideV:nbb2}})]});

    var children=cover.concat(resumo).concat(blocoSecs).concat(paramSec).concat(nextSec);
    var doc=new D.Document({styles:{default:{document:{run:{font:'Arial',size:20}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134}}},headers:{default:hdrObj},footers:{default:ftrObj},children:children}]});

    D.Packer.toBuffer(doc).then(function(buf){
      var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
      var fname='Diagnostico_'+((E.razaoSocial||E.nome||'Empresa').replace(/\s+/g,'_'))+'_'+today.replace(/\//g,'-')+'.docx';
      window.saveAs(blob,fname);
      showToast('✅ Documento gerado com sucesso!');
      if(btn){btn.disabled=false;btn.textContent='📄 Baixar Documento Word (.docx)';}
    }).catch(function(err){
      showToast('Erro: '+err.message,'error');
      if(btn){btn.disabled=false;btn.textContent='📄 Baixar Documento Word (.docx)';}
    });
  }catch(err){
    showToast('Erro: '+err.message,'error');
    if(btn){btn.disabled=false;btn.textContent='📄 Baixar Documento Word (.docx)';}
    console.error(err);
  }
}

// INIT
window.addEventListener('DOMContentLoaded',function(){
  if(typeof getToken==='function'&&!getToken()){ window.location.href='login.html'; return; }
  route('list');
});
