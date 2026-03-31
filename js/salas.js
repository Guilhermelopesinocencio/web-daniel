// =====================
//   SALAS.JS
// =====================

const form = document.querySelector('form');
const inputNome = document.getElementById('nome');
const inputCapacidade = document.getElementById('capacidade');
const selectTipo = document.getElementById('tipo');
const tabelaBody = document.getElementById('tabelaFilmes');

// ----- Utilitários -----

// Retorna a lista de salas salva no localStorage.
function getSalas() {
    return JSON.parse(localStorage.getItem('salas')) || [];
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

// Persiste a lista de salas.
function salvarSalas(salas) {
    return salvarNoStorage('salas', salas);
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

// ----- Renderização -----

// Renderiza a tabela com as salas cadastradas.
function renderizarTabela() {
    const salas = getSalas();

    if (salas.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-secondary py-4">Nenhuma sala cadastrada ainda.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = salas.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${s.nome}</td>
            <td>${s.capacidade} lugares</td>
            <td>${s.tipo}</td>
            <td>
                <button class="btn-danger-outline" onclick="excluirSala(${s.id})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

// ----- Ações -----

// Exclui uma sala e seus dados dependentes (sessões e ingressos).
function excluirSala(id) {
    if (!confirm('Deseja excluir esta sala?')) return;
    const idNormalizado = normalizarId(id);
    let salas = getSalas().filter(s => normalizarId(s.id) !== idNormalizado);
    salvarSalas(salas);

    const sessoesRestantes = getSessoes().filter(s => normalizarId(s.salaId) !== idNormalizado);
    salvarSessoes(sessoesRestantes);

    const idsSessoesRestantes = new Set(sessoesRestantes.map(s => normalizarId(s.id)));
    const ingressosRestantes = getIngressos().filter(i => idsSessoesRestantes.has(normalizarId(i.sessaoId)));
    salvarIngressos(ingressosRestantes);

    renderizarTabela();
}

// ----- Submissão -----

// Trata o envio do formulário de cadastro de sala.
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const capacidade = inputCapacidade.value;
    const tipo = selectTipo.value;

    if (!nome || !capacidade || !tipo) {
        alert('Preencha todos os campos obrigatórios (*).');
        return;
    }

    const salas = getSalas();
    salas.push({
        id: normalizarId(Date.now()),
        nome,
        capacidade,
        tipo
    });

    salvarSalas(salas);
    renderizarTabela();
    form.reset();
});

// ----- Inicialização -----
renderizarTabela();