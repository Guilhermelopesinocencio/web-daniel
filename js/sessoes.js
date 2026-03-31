// =====================
//   SESSOES.JS
// =====================

const form = document.querySelector('form');
const selectFilme = document.getElementById('filmeId');
const selectSala = document.getElementById('salaId');
const inputDataHora = document.getElementById('dataHora');
const inputPreco = document.getElementById('preco');
const selectIdioma = document.getElementById('idioma');
const selectFormato = document.getElementById('formato');
const tabelaBody = document.getElementById('tabelaFilmes');

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
    const d = new Date(dt);
    return d.toLocaleString('pt-BR');
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

// ----- Carrega selects -----

// Carrega os selects de filme e sala a partir do localStorage.
function carregarSelects() {
    const filmes = getFilmes();
    const salas = getSalas();

    selectFilme.innerHTML = '<option value="">— Selecione um filme —</option>';
    filmes.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.titulo;
        selectFilme.appendChild(opt);
    });

    selectSala.innerHTML = '<option value="">— Selecione uma sala —</option>';
    salas.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nome;
        selectSala.appendChild(opt);
    });
}

// ----- Renderização -----

// Renderiza a tabela com as sessões cadastradas.
function renderizarTabela() {
    const sessoes = getSessoes();
    const filmes = getFilmes();
    const salas = getSalas();

    if (sessoes.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-secondary py-4">Nenhuma sessão cadastrada ainda.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = sessoes.map((s, i) => {
        const filme = filmes.find(f => normalizarId(f.id) === normalizarId(s.filmeId));
        const sala = salas.find(sl => normalizarId(sl.id) === normalizarId(s.salaId));
        return `
            <tr>
                <td>${i + 1}</td>
                <td>${filme ? filme.titulo : '-'}</td>
                <td>${sala ? sala.nome : '-'}</td>
                <td>${formatarDataHora(s.dataHora)}</td>
                <td>${s.idioma}</td>
                <td>${s.formato}</td>
                <td class="preco-verde">${formatarPreco(s.preco)}</td>
                <td>
                    <button class="btn-danger-outline" onclick="excluirSessao(${s.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ----- Ações -----

// Exclui sessão e ingressos vinculados a ela.
function excluirSessao(id) {
    if (!confirm('Deseja excluir esta sessão?')) return;
    const idNormalizado = normalizarId(id);
    let sessoes = getSessoes().filter(s => normalizarId(s.id) !== idNormalizado);
    salvarSessoes(sessoes);

    let ingressos = getIngressos().filter(i => normalizarId(i.sessaoId) !== idNormalizado);
    salvarIngressos(ingressos);

    renderizarTabela();
}

// ----- Submissão -----

// Trata o envio do formulário de cadastro de sessão.
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const filmeId = selectFilme.value;
    const salaId = selectSala.value;
    const dataHora = inputDataHora.value;
    const preco = inputPreco.value;
    const idioma = selectIdioma.value;
    const formato = selectFormato.value;

    if (!filmeId || !salaId || !dataHora || !preco || !idioma || !formato) {
        alert('Preencha todos os campos obrigatórios (*).');
        return;
    }

    const filmeExiste = getFilmes().some(f => normalizarId(f.id) === normalizarId(filmeId));
    const salaExiste = getSalas().some(s => normalizarId(s.id) === normalizarId(salaId));
    if (!filmeExiste || !salaExiste) {
        alert('Não é possível criar sessão sem filme e sala válidos.');
        carregarSelects();
        return;
    }

    const sessoes = getSessoes();
    sessoes.push({
        id: normalizarId(Date.now()),
        filmeId: normalizarId(filmeId),
        salaId: normalizarId(salaId),
        dataHora,
        preco,
        idioma,
        formato
    });

    salvarSessoes(sessoes);
    renderizarTabela();
    form.reset();
    carregarSelects();
});

// ----- Inicialização -----
limparDadosOrfaos();
carregarSelects();
renderizarTabela();