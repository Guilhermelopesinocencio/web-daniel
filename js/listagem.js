// =====================
//   LISTAGEM.JS
// =====================

const tabelaBody = document.getElementById('tabelaSessoes');

// ----- Utilitários -----

// Retorna a lista de sessões salva no localStorage.
function getSessoes() {
    return JSON.parse(localStorage.getItem('sessoes')) || [];
}

// Salva dados no localStorage com tratamento de erro.
function salvarNoStorage(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
    } catch (e) {
        if (e && e.name === 'QuotaExceededError') {
            alert('Limite de armazenamento local atingido no navegador.');
            return false;
        }
        console.error('Erro ao salvar no localStorage:', e);
        alert('Ocorreu um erro ao salvar os dados.');
        return false;
    }
    return true;
}

// Retorna a lista de filmes salva no localStorage.
function getFilmes() {
    return JSON.parse(localStorage.getItem('filmes')) || [];
}

// Retorna a lista de salas salva no localStorage.
function getSalas() {
    return JSON.parse(localStorage.getItem('salas')) || [];
}

// Persiste a lista de sessões.
function salvarSessoes(sessoes) {
    return salvarNoStorage('sessoes', sessoes);
}

// Retorna a lista de ingressos salva no localStorage.
function getIngressos() {
    return JSON.parse(localStorage.getItem('ingressos')) || [];
}

// Persiste a lista de ingressos.
function salvarIngressos(ingressos) {
    return salvarNoStorage('ingressos', ingressos);
}

// Converte qualquer id para string.
function normalizarId(id) {
    return String(id);
}

// Formata data/hora para o padrão brasileiro.
function formatarDataHora(dt) {
    if (!dt) return '-';
    return new Date(dt).toLocaleString('pt-BR');
}

// Formata valor numérico como moeda brasileira.
function formatarPreco(valor) {
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Remove sessões e ingressos órfãos quando faltar filme/sala/sessão.
function limparDadosOrfaos() {
    const filmes = getFilmes();
    const salas = getSalas();
    const idsFilmes = new Set(filmes.map(f => normalizarId(f.id)));
    const idsSalas = new Set(salas.map(s => normalizarId(s.id)));

    const sessoesValidas = getSessoes().filter(s =>
        idsFilmes.has(normalizarId(s.filmeId)) &&
        idsSalas.has(normalizarId(s.salaId))
    );
    salvarSessoes(sessoesValidas);

    const idsSessoes = new Set(sessoesValidas.map(s => normalizarId(s.id)));
    const ingressosValidos = getIngressos().filter(i => idsSessoes.has(normalizarId(i.sessaoId)));
    salvarIngressos(ingressosValidos);
}

// ----- Renderização -----

// Renderiza a tabela de sessões disponíveis.
function renderizarSessoes() {
    const sessoes = getSessoes();
    const filmes = getFilmes();
    const salas = getSalas();

    if (sessoes.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-4">Nenhuma sessão disponível.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = sessoes.map(s => {
        const filme = filmes.find(f => normalizarId(f.id) === normalizarId(s.filmeId));
        const sala = salas.find(sl => normalizarId(sl.id) === normalizarId(s.salaId));

        return `
            <tr>
                <td>${filme ? filme.titulo : '-'}</td>
                <td>${sala ? sala.nome : '-'}</td>
                <td>${formatarDataHora(s.dataHora)}</td>
                <td class="preco-verde">${formatarPreco(s.preco)}</td>
                <td>
                    <button class="btn-comprar" onclick="comprarIngresso(${s.id})">Comprar Ingresso</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ----- Ação -----

// Redireciona para a venda com a sessão selecionada.
function comprarIngresso(sessaoId) {
    window.location.href = `venda-ingressos.html?sessaoId=${sessaoId}`;
}

// ----- Inicialização -----
limparDadosOrfaos();
renderizarSessoes();