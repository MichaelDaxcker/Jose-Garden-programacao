const indicator = document.querySelector('.indicator');
const activeItem = document.querySelector('.list.active');

if (activeItem) {
    const itemRect = activeItem.getBoundingClientRect();
    const navRect = activeItem.closest('.navigation').getBoundingClientRect();

    indicator.style.transform =
        `translateX(${itemRect.left - navRect.left + itemRect.width / 2 - indicator.offsetWidth / 2}px)`;
}

let indiceAtual = 0;

function abrirModal(elemento) {
    const modal = document.getElementById('galeraModal');
    const img = elemento.querySelector('img');
    const imgModal = document.getElementById('imgModal');
    const legenda = document.getElementById('legenda');
    
    imgModal.src = img.src;
    legenda.textContent = img.alt;
    modal.classList.add('ativa');
    
    indiceAtual = Array.from(document.querySelectorAll('.galeria-item')).indexOf(elemento);
}

function fecharModal() {
    const modal = document.getElementById('galeraModal');
    modal.classList.remove('ativa');
}

function mudarImagem(n) {
    const items = document.querySelectorAll('.galeria-item');
    indiceAtual += n;
    
    if (indiceAtual >= items.length) indiceAtual = 0;
    if (indiceAtual < 0) indiceAtual = items.length - 1;
    
    const img = items[indiceAtual].querySelector('img');
    document.getElementById('imgModal').src = img.src;
    document.getElementById('legenda').textContent = img.alt;
}

document.addEventListener('keydown', (e) => {
    const modalGaleria = document.getElementById('galeraModal');

    if (modalGaleria && modalGaleria.classList.contains('ativa')) {
        if (e.key === 'ArrowLeft') mudarImagem(-1);
        if (e.key === 'ArrowRight') mudarImagem(1);
        if (e.key === 'Escape') fecharModal();
    }
});

const formContacto = document.getElementById('formContacto');

if (formContacto) {
    formContacto.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Limpar erros anteriores
        document.querySelectorAll('.erro').forEach(el => el.textContent = '');
        document.querySelectorAll('.form-grupo input, .form-grupo textarea').forEach(el => el.classList.remove('erro'));
        
        // Obter valores
        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const assunto = document.getElementById('assunto').value.trim();
        const mensagem = document.getElementById('mensagem').value.trim();
        
        let temErro = false;
        
        // Validações
        if (!nome) {
            document.getElementById('erroNome').textContent = 'Nome é obrigatório';
            document.getElementById('nome').classList.add('erro');
            temErro = true;
        }
        
        if (!email) {
            document.getElementById('erroEmail').textContent = 'Email é obrigatório';
            document.getElementById('email').classList.add('erro');
            temErro = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('erroEmail').textContent = 'Email inválido';
            document.getElementById('email').classList.add('erro');
            temErro = true;
        }
        
        if (telefone && !/^[0-9\s\-\+\(\)]{9,}$/.test(telefone)) {
            document.getElementById('erroTelefone').textContent = 'Telefone inválido';
            document.getElementById('telefone').classList.add('erro');
            temErro = true;
        }
        
        if (!assunto) {
            document.getElementById('erroAssunto').textContent = 'Assunto é obrigatório';
            document.getElementById('assunto').classList.add('erro');
            temErro = true;
        }
        
        if (!mensagem) {
            document.getElementById('erroMensagem').textContent = 'Mensagem é obrigatória';
            document.getElementById('mensagem').classList.add('erro');
            temErro = true;
        }
        
        if (!temErro) {
            // Aqui você pode enviar os dados para um servidor
            console.log({ nome, email, telefone, assunto, mensagem });
            
            // Mostrar mensagem de sucesso
            const msgSucesso = document.getElementById('mensagemSucesso');
            msgSucesso.textContent = '✔ Mensagem enviada com sucesso! Entraremos em contacto em breve.';
            msgSucesso.classList.add('ativa');
            
            // Limpar formulário
            formContacto.reset();
            
            // Remover mensagem após 5 segundos
            setTimeout(() => {
                msgSucesso.classList.remove('ativa');
            }, 5000);
        }
    });
}

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');
const authForms = document.getElementById('authForms');
const googleAuthStatus = document.getElementById('googleAuthStatus');
const accountInfo = document.getElementById('accountInfo');
const accountName = document.getElementById('accountName');
const logoutButton = document.getElementById('logoutButton');

if (googleAuthStatus) {
    const error = new URLSearchParams(window.location.search).get('error');
    const mensagensGoogle = {
        auth_failed: 'O acesso ao Google foi cancelado ou recusado.',
        google_not_configured: 'O início de sessão Google não está configurado no servidor.',
        missing_code: 'O Google não devolveu o código de autenticação. Tente novamente.',
        server_error: 'Não foi possível concluir o início de sessão Google. Verifique a configuração OAuth e tente novamente.'
    };

    if (error && mensagensGoogle[error]) {
        googleAuthStatus.textContent = mensagensGoogle[error];
        googleAuthStatus.classList.add('ativa', 'erro');
    }
}

function mostrarNomeNaNav(nome) {
    const nomeLimpo = String(nome || '').trim();

    if (!nomeLimpo) {
        return;
    }

    const navTextos = document.querySelectorAll('li.login-button .text');
    navTextos.forEach((texto) => {
        texto.textContent = nomeLimpo;
    });

    const navLinks = document.querySelectorAll('li.login-button a');
    navLinks.forEach((link) => {
        link.setAttribute('aria-label', nomeLimpo);
    });
}

function limparNomeDaNav() {
    const navTextos = document.querySelectorAll('li.login-button .text');
    navTextos.forEach((texto) => {
        texto.textContent = 'Iniciar Sessão';
    });
}

function apresentarConta(nome) {
    const nomeExibicao = nome || 'Utilizador';
    mostrarNomeNaNav(nomeExibicao);

    if (authForms) {
        authForms.hidden = true;
    }
    if (accountInfo && accountName) {
        accountInfo.classList.remove('hidden');
        accountInfo.classList.add('active');
        accountName.textContent = nomeExibicao;
    }
}

function apresentarFormulariosConta() {
    if (authForms) {
        authForms.hidden = false;
    }
    if (accountInfo) {
        accountInfo.classList.add('hidden');
        accountInfo.classList.remove('active');
    }
}

function apresentarMensagemAuth(mensagem, erro = false) {
    if (!authMessage) return;
    authMessage.textContent = mensagem;
    authMessage.classList.add('ativa');
    authMessage.classList.toggle('erro', erro);
}

async function enviarPedidoAuth(url, dados) {
    let resposta;
    try {
        resposta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(dados)
        });
    } catch (erro) {
        throw new Error('Não foi possível ligar ao servidor. Abra http://localhost:3000/login.html e confirme que executou npm start na pasta do site.');
    }

    const conteudo = await resposta.text();
    let resultado;
    try {
        resultado = conteudo ? JSON.parse(conteudo) : {};
    } catch (erro) {
        throw new Error('O servidor em execução ainda não suporta contas. Pare-o com Ctrl+C e inicie novamente com npm start.');
    }

    if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Não foi possível concluir o pedido.');
    }
    return resultado;
}

async function carregarUsuarioSessao() {
    try {
        const resposta = await fetch('/api/user', {
            headers: {
                Accept: 'application/json'
            }
        });

        if (!resposta.ok) {
            limparNomeDaNav();
            return;
        }

        const dados = await resposta.json();

        if (dados && dados.logado && dados.user) {
            const nome = dados.user.name || dados.user.email?.split('@')[0] || 'Utilizador';
            apresentarConta(nome);
        } else {
            limparNomeDaNav();
            apresentarFormulariosConta();
        }
    } catch (erro) {
        limparNomeDaNav();
        apresentarFormulariosConta();
    }
}

function abrirAbaAuth(tipo) {
    if (!loginForm || !registerForm || !tabLogin || !tabRegister) return;

    const loginAtivo = tipo === 'login';

    tabLogin.classList.toggle('active', loginAtivo);
    tabRegister.classList.toggle('active', !loginAtivo);

    loginForm.classList.toggle('active', loginAtivo);
    registerForm.classList.toggle('active', !loginAtivo);
}

if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => abrirAbaAuth('login'));
    tabRegister.addEventListener('click', () => abrirAbaAuth('register'));
}

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;

        if (!email || !password) {
            apresentarMensagemAuth('Preencha email e senha para entrar.', true);
            return;
        }

        const botao = loginForm.querySelector('[type="submit"]');
        botao.disabled = true;
        try {
            const resultado = await enviarPedidoAuth('/api/login', { email, password });
            apresentarMensagemAuth(resultado.mensagem);
            apresentarConta(resultado.user.name);
            loginForm.reset();
        } catch (erro) {
            apresentarMensagemAuth(erro.message || 'Não foi possível iniciar sessão.', true);
        } finally {
            botao.disabled = false;
        }
    });
}

if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('registerName')?.value.trim();
        const email = document.getElementById('registerEmail')?.value.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerConfirm')?.value;

        if (!nome || !email || !password || !confirmPassword) {
            apresentarMensagemAuth('Preencha todos os campos da conta.', true);
            return;
        }

        if (password.length < 8 || password.length > 128) {
            apresentarMensagemAuth('A senha deve ter entre 8 e 128 caracteres.', true);
            return;
        }

        if (password !== confirmPassword) {
            apresentarMensagemAuth('As senhas não coincidem.', true);
            return;
        }

        const botao = registerForm.querySelector('[type="submit"]');
        botao.disabled = true;
        try {
            const resultado = await enviarPedidoAuth('/api/register', { name: nome, email, password });
            apresentarMensagemAuth(resultado.mensagem);
            apresentarConta(resultado.user.name);
            registerForm.reset();
        } catch (erro) {
            apresentarMensagemAuth(erro.message || 'Não foi possível criar a conta.', true);
        } finally {
            botao.disabled = false;
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        if (accountInfo) {
            accountInfo.classList.add('hidden');
            accountInfo.classList.remove('active');
        }

        try {
            const resposta = await fetch('/logout', {
                method: 'GET',
                headers: { Accept: 'application/json' }
            });
            if (!resposta.ok) {
                throw new Error('O servidor não conseguiu terminar a sessão.');
            }
        } catch (erro) {
            console.error('Logout falhou no cliente:', erro);
            apresentarMensagemAuth('Não foi possível terminar a sessão. Tente novamente.', true);
            return;
        }

        limparNomeDaNav();
        apresentarFormulariosConta();

        if (authMessage) {
            authMessage.textContent = 'Saiu com sucesso.';
            authMessage.classList.add('ativa');
            authMessage.classList.remove('erro');
        }

        abrirAbaAuth('login');
    });
}

carregarUsuarioSessao();

// Sistema de avaliações
const avaliacaoStars = Array.from(document.querySelectorAll('#textoAvaliacao, .avaliacao-estrelas .star'));
const avaliacaoStarButtons = Array.from(document.querySelectorAll('.avaliacao-estrelas .star'));
const comentarioInput = document.getElementById('comentario');
const nomeInput = document.getElementById('nomeAvaliador');
const botaoEnviarAvaliacao = document.getElementById('enviarAvaliacao');
const resultadoAvaliacao = document.getElementById('resultadoAvaliacao');
const listaAvaliacoes = document.getElementById('listaAvaliacoes');

let avaliacaoAtual = 0;

function renderizarEstrelasSelecionadas(valor) {
    if (!avaliacaoStarButtons.length) return;

    avaliacaoStarButtons.forEach((star) => {
        const valorStar = Number(star.getAttribute('data-avaliacao'));
        star.classList.toggle('ativo', valorStar <= valor);
    });

    const texto = document.getElementById('textoAvaliacao');
    if (texto) {
        const rotulos = {
            1: 'Muito insatisfeito',
            2: 'Pouco satisfeito',
            3: 'Satisfatório',
            4: 'Muito bom',
            5: 'Excelente'
        };

        texto.textContent = valor ? `Sua avaliação: ${rotulos[valor]}` : 'Clique em uma estrela para avaliar.';
    }
}

if (avaliacaoStarButtons.length) {
    avaliacaoStarButtons.forEach((star) => {
        star.addEventListener('click', () => {
            avaliacaoAtual = Number(star.getAttribute('data-avaliacao'));
            renderizarEstrelasSelecionadas(avaliacaoAtual);
        });
    });
}

function formatarDataHora(dataISO) {
    if (!dataISO) return 'Data desconhecida';

    const data = new Date(dataISO);
    if (Number.isNaN(data.getTime())) return 'Data desconhecida';

    return new Intl.DateTimeFormat('pt-PT', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(data);
}

async function parseApiResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const raw = await response.text();

    if (!raw) {
        return {};
    }

    const looksLikeJson = contentType.includes('application/json') || raw.trim().startsWith('{') || raw.trim().startsWith('[');

    if (!looksLikeJson) {
        throw new Error(raw.slice(0, 140) || 'Resposta inesperada do servidor.');
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error('Resposta do servidor não é JSON válido.');
    }
}

function mensagemErroAvaliacao(error) {
    if (error instanceof TypeError) {
        return 'Não foi possível ligar ao servidor de avaliações. Inicie o servidor com "npm start" e abra http://localhost:3000/avaliacao.html.';
    }

    return error.message || 'Ocorreu um erro ao comunicar com o servidor de avaliações.';
}

async function buscarAvaliacoes() {
    if (!listaAvaliacoes) return;

    try {
        const resposta = await fetch('/api/avaliacoes');
        if (!resposta.ok) {
            const dados = await parseApiResponse(resposta);
            throw new Error(dados.mensagem || 'Não foi possível carregar as avaliações');
        }

        const dados = await parseApiResponse(resposta);
        const avaliacoes = Array.isArray(dados.avaliacoes) ? dados.avaliacoes : [];

        if (!avaliacoes.length) {
            listaAvaliacoes.innerHTML = '<p>Seja o primeiro a avaliar.</p>';
            return;
        }

        listaAvaliacoes.innerHTML = avaliacoes.map((item) => {
            const data = formatarDataHora(item.data || item.criadaEm);
            const estrelas = Array.from({ length: 5 }, (_, index) => index < Number(item.avaliacao) ? '★' : '☆').join('');
            const comentario = item.comentario ? item.comentario : 'Sem comentário.';
            const nome = item.nome ? item.nome : 'Anónimo';

            return `<article class="avaliacao-item">
                <div class="meta">
                    <span class="autor">${escapeHtml(nome)}</span>
                    <span class="data-hora"> · ${data}</span>
                </div>
                <div>${estrelas}</div>
                <p>${escapeHtml(comentario)}</p>
                <button class="remover-avaliacao" data-id="${item.id}">Remover</button>
            </article>`;
        }).join('');

        listaAvaliacoes.querySelectorAll('[data-id]').forEach((botao) => {
            botao.addEventListener('click', async () => {
                const id = botao.getAttribute('data-id');
                await removerAvaliacao(id);
            });
        });
    } catch (error) {
        console.error(error);
        listaAvaliacoes.innerHTML = `<p>${escapeHtml(mensagemErroAvaliacao(error))}</p>`;
    }
}

function escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function removerAvaliacao(id) {
    if (!id) return;

    try {
        const resposta = await fetch(`/api/avaliacoes/${id}`, {
            method: 'DELETE'
        });

        const dados = await parseApiResponse(resposta);

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível remover a avaliação');
        }

        if (resultadoAvaliacao) {
            resultadoAvaliacao.textContent = dados.mensagem || 'Avaliação removida.';
        }

        await buscarAvaliacoes();
    } catch (error) {
        console.error(error);
        if (resultadoAvaliacao) {
            resultadoAvaliacao.textContent = mensagemErroAvaliacao(error);
        }
    }
}

if (botaoEnviarAvaliacao) {
    botaoEnviarAvaliacao.addEventListener('click', async () => {
        if (!avaliacaoAtual) {
            if (resultadoAvaliacao) {
                resultadoAvaliacao.textContent = 'Escolha uma estrela antes de enviar.';
            }
            return;
        }

        const comentario = comentarioInput ? comentarioInput.value.trim() : '';
        const nome = nomeInput ? nomeInput.value.trim() : '';

        try {
            const resposta = await fetch('/api/avaliacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avaliacao: avaliacaoAtual, comentario, nome })
            });

            const dados = await parseApiResponse(resposta);

            if (!resposta.ok) {
                throw new Error(dados.mensagem || 'Erro ao enviar avaliação');
            }

            if (resultadoAvaliacao) {
                resultadoAvaliacao.textContent = dados.mensagem || 'Avaliação enviada com sucesso!';
            }

            avaliacaoAtual = 0;
            renderizarEstrelasSelecionadas(0);

            if (comentarioInput) {
                comentarioInput.value = '';
            }

            if (nomeInput) {
                nomeInput.value = '';
            }

            await buscarAvaliacoes();
        } catch (error) {
            console.error(error);
            if (resultadoAvaliacao) {
                resultadoAvaliacao.textContent = mensagemErroAvaliacao(error);
            }
        }
    });
}

buscarAvaliacoes();
