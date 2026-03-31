// =====================
//   FILMES.JS
// =====================

const form = document.querySelector('form');
const inputTitulo = document.querySelector('input[placeholder="Ex: Vingadores: Ultimato"]');
const selectGenero = document.getElementById('genero');
const inputDescricao = document.querySelector('textarea');
const selectClassificacao = document.getElementById('classificacao');
const inputDuracao = document.getElementById('duracao');
const inputEstreia = document.getElementById('estreia');
const tabelaBody = document.getElementById('tabelaFilmes');

// ----- Utilitários -----

// Retorna a lista de filmes salva no localStorage.
function getFilmes() {
    return JSON.parse(localStorage.getItem('filmes')) || [];
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

// Persiste a lista de filmes.
function salvarFilmes(filmes) {
    return salvarNoStorage('filmes', filmes);
}

// Retorna a lista de sessões salva no localStorage.
function getSessoes() {
    return JSON.parse(localStorage.getItem('sessoes')) || [];
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

// Formata data ISO para o padrão brasileiro.
function formatarData(dataISO) {
    if (!dataISO) return '-';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// ----- Renderização -----

// Renderiza a tabela com os filmes cadastrados.
function renderizarTabela() {
    const filmes = getFilmes();

    if (filmes.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-secondary py-4">Nenhum filme cadastrado ainda.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = filmes.map((f, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${f.titulo}</td>
            <td>${f.genero}</td>
            <td>${f.classificacao}</td>
            <td>${f.duracao} min</td>
            <td>${formatarData(f.estreia)}</td>
            <td>
                <button class="btn-danger-outline" onclick="excluirFilme(${f.id})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

// ----- Ações -----

// Exclui um filme e seus dados dependentes (sessões e ingressos).
function excluirFilme(id) {
    if (!confirm('Deseja excluir este filme?')) return;
    const idNormalizado = normalizarId(id);
    let filmes = getFilmes().filter(f => normalizarId(f.id) !== idNormalizado);
    salvarFilmes(filmes);

    const sessoesRestantes = getSessoes().filter(s => normalizarId(s.filmeId) !== idNormalizado);
    salvarSessoes(sessoesRestantes);

    const idsSessoesRestantes = new Set(sessoesRestantes.map(s => normalizarId(s.id)));
    const ingressosRestantes = getIngressos().filter(i => idsSessoesRestantes.has(normalizarId(i.sessaoId)));
    salvarIngressos(ingressosRestantes);

    renderizarTabela();
}

// ----- Submissão -----

// Trata o envio do formulário de cadastro de filme.
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const titulo = inputTitulo.value.trim();
    const genero = selectGenero.value;
    const descricao = inputDescricao.value.trim();
    const classificacao = selectClassificacao.value;
    const duracao = inputDuracao.value;
    const estreia = inputEstreia.value;

    if (!titulo || !genero || !classificacao || !duracao || !estreia) {
        alert('Preencha todos os campos obrigatórios (*).');
        return;
    }

    const filmes = getFilmes();
    filmes.push({
        id: normalizarId(Date.now()),
        titulo,
        genero,
        descricao,
        classificacao,
        duracao,
        estreia
    });

    salvarFilmes(filmes);
    renderizarTabela();
    form.reset();
});

// ----- Inicialização -----
renderizarTabela();