// =====================
//   INGRESSOS.JS
// =====================

const form = document.querySelector('form');
const selectSessao = document.getElementById('sessaoId');
const inputCliente = document.getElementById('nomeCliente');
const inputCpf = document.getElementById('cpf');
const inputAssento = document.getElementById('assento');
const selectPagamento = document.getElementById('pagamento');
const tabelaBody = document.getElementById('tabelaFilmes');

// ----- Utilitários -----

// Retorna a lista de ingressos salva no localStorage.
function getIngressos() {
    return JSON.parse(localStorage.getItem('ingressos')) || [];
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

// Retorna a lista de sessões salva no localStorage.
function getSessoes() {
    return JSON.parse(localStorage.getItem('sessoes')) || [];
}

// Retorna a lista de filmes salva no localStorage.
function getFilmes() {
    return JSON.parse(localStorage.getItem('filmes')) || [];
}

// Retorna a lista de salas salva no localStorage.
function getSalas() {
    return JSON.parse(localStorage.getItem('salas')) || [];
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

// Aplica máscara de CPF ao valor informado.
function formatarCPF(cpf) {
    const s = cpf.replace(/\D/g, '');
    if (s.length !== 11) return cpf;
    return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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
    salvarNoStorage('sessoes', sessoesValidas);

    const idsSessoes = new Set(sessoesValidas.map(s => normalizarId(s.id)));
    const ingressosValidos = getIngressos().filter(i => idsSessoes.has(normalizarId(i.sessaoId)));
    salvarIngressos(ingressosValidos);
}

// ----- CPF: máscara automática -----

inputCpf.addEventListener('input', function () {
    let val = this.value.replace(/\D/g, '').slice(0, 11);
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    this.value = val;
});

// ----- Carrega select de sessões -----

// Carrega no select apenas sessões com filme e sala válidos.
function carregarSelectSessoes() {
    const sessoes = getSessoes();
    const filmes = getFilmes();
    const salas = getSalas();

    selectSessao.innerHTML = '<option value="">— Selecione uma sessão —</option>';

    sessoes.forEach(s => {
        const filme = filmes.find(f => normalizarId(f.id) === normalizarId(s.filmeId));
        const sala = salas.find(sl => normalizarId(sl.id) === normalizarId(s.salaId));
        if (!filme || !sala) return;
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${filme ? filme.titulo : '?'} | ${sala ? sala.nome : '?'} | ${formatarDataHora(s.dataHora)} | ${formatarPreco(s.preco)}`;
        selectSessao.appendChild(opt);
    });

    // Verifica se veio de sessoes.html com ?sessaoId=
    const params = new URLSearchParams(window.location.search);
    const sessaoIdParam = params.get('sessaoId');
    if (sessaoIdParam) {
        selectSessao.value = sessaoIdParam;
    }
}

// ----- Renderização da tabela -----

// Renderiza a tabela com os ingressos vendidos.
function renderizarTabela() {
    const ingressos = getIngressos();
    const sessoes = getSessoes();
    const filmes = getFilmes();
    const salas = getSalas();

    if (ingressos.length === 0) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-secondary py-4">Nenhum ingresso vendido ainda.</td>
            </tr>`;
        return;
    }

    tabelaBody.innerHTML = ingressos.map((ing, i) => {
        const sessao = sessoes.find(s => normalizarId(s.id) === normalizarId(ing.sessaoId));
        const filme = sessao ? filmes.find(f => normalizarId(f.id) === normalizarId(sessao.filmeId)) : null;
        const sala = sessao ? salas.find(sl => normalizarId(sl.id) === normalizarId(sessao.salaId)) : null;

        return `
            <tr>
                <td>${i + 1}</td>
                <td>${filme ? filme.titulo : '-'}</td>
                <td>${sala ? sala.nome : '-'}</td>
                <td>${sessao ? formatarDataHora(sessao.dataHora) : '-'}</td>
                <td>${ing.nomeCliente}</td>
                <td>${ing.cpf}</td>
                <td>${ing.assento}</td>
                <td>${ing.pagamento}</td>
                <td class="preco-verde">${sessao ? formatarPreco(sessao.preco) : '-'}</td>
                <td>
                    <button class="btn-danger-outline" onclick="excluirIngresso(${ing.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ----- Ações -----

// Exclui um ingresso pelo id.
function excluirIngresso(id) {
    if (!confirm('Deseja excluir este ingresso?')) return;
    const idNormalizado = normalizarId(id);
    let ingressos = getIngressos().filter(i => normalizarId(i.id) !== idNormalizado);
    salvarIngressos(ingressos);
    renderizarTabela();
}

// ----- Submissão -----

// Trata o envio do formulário de venda de ingresso.
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const sessaoId = selectSessao.value;
    const nomeCliente = inputCliente.value.trim();
    const cpf = inputCpf.value.trim();
    const assento = inputAssento.value.trim();
    const pagamento = selectPagamento.value;

    if (!sessaoId || !nomeCliente || !cpf || !assento || !pagamento) {
        alert('Preencha todos os campos obrigatórios (*).');
        return;
    }

    const sessaoValida = getSessoes().some(s => normalizarId(s.id) === normalizarId(sessaoId));
    if (!sessaoValida) {
        alert('Não é possível vender ingresso para sessão inexistente.');
        carregarSelectSessoes();
        return;
    }

    const ingressos = getIngressos();

    // Verifica assento duplicado na mesma sessão
    const assentoDuplicado = ingressos.some(i =>
        normalizarId(i.sessaoId) === normalizarId(sessaoId) &&
        i.assento.toUpperCase() === assento.toUpperCase()
    );
    if (assentoDuplicado) {
        alert(`O assento "${assento.toUpperCase()}" já está ocupado nesta sessão.`);
        return;
    }

    ingressos.push({
        id: normalizarId(Date.now()),
        sessaoId: normalizarId(sessaoId),
        nomeCliente,
        cpf,
        assento: assento.toUpperCase(),
        pagamento
    });

    salvarIngressos(ingressos);
    renderizarTabela();
    form.reset();
    carregarSelectSessoes();
});

// ----- Inicialização -----
limparDadosOrfaos();
carregarSelectSessoes();
renderizarTabela();