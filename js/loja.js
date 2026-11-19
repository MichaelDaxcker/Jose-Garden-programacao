const formAnuncio = document.getElementById('formAnuncio');
const resultadoAnuncio = document.getElementById('resultadoAnuncio');
const listaAnuncios = document.getElementById('listaAnuncios');
const pesquisaAnuncios = document.getElementById('pesquisaAnuncios');
const resultadoExclusaoAnuncio = document.getElementById('resultadoExclusaoAnuncio');
const secaoPublicarAnuncio = document.getElementById('secaoPublicarAnuncio');
const detalhesAnuncioModal = document.getElementById('detalhesAnuncio');
const detalhesAnuncioConteudo = document.getElementById('detalhesAnuncioConteudo');
const detalhesAnuncioTitulo = document.getElementById('detalhesAnuncioTitulo');
const inputFotografiaAnuncio = document.getElementById('anuncioImagem');
const previaFotografiaAnuncio = document.getElementById('previaFotografiaAnuncio');
const imagemPreviaAnuncio = document.getElementById('imagemPreviaAnuncio');
const removerFotografiaAnuncio = document.getElementById('removerFotografiaAnuncio');
let anunciosDisponiveis = [];
let utilizadorAdministrador = false;
let fotografiaAnuncioDataUrl = '';
let leituraFotografiaEmCurso = false;
const tamanhoMaximoFotografiaAnuncio = 5 * 1024 * 1024;

function escaparTextoAnuncio(valor) {
    return String(valor).replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatarPrecoAnuncio(preco) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(preco);
}

function formatarDataAnuncio(dataISO) {
    const data = new Date(dataISO);
    if (Number.isNaN(data.getTime())) return '';
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium' }).format(data);
}

function obterContactosAnuncio(anuncio) {
    let telefone = typeof anuncio.telefone === 'string' ? anuncio.telefone.trim() : '';
    let email = typeof anuncio.email === 'string' ? anuncio.email.trim() : '';

    if (!telefone && !email && typeof anuncio.contacto === 'string') {
        const contactoAntigo = anuncio.contacto.trim();
        if (contactoAntigo.includes('@')) {
            email = contactoAntigo;
        } else {
            telefone = contactoAntigo;
        }
    }

    return { telefone, email };
}

function criarImagemAnuncio(anuncio) {
    if (!anuncio.imagem) {
        const semImagem = document.createElement('div');
        semImagem.className = 'detalhes-anuncio-sem-imagem';
        semImagem.textContent = 'Sem fotografia';
        return semImagem;
    }

    const imagem = document.createElement('img');
    imagem.className = 'detalhes-anuncio-imagem';
    imagem.src = anuncio.imagem;
    imagem.alt = anuncio.titulo;
    return imagem;
}

function abrirDetalhesAnuncio(id) {
    const anuncio = anunciosDisponiveis.find((item) => item.id === id);
    if (!anuncio || !detalhesAnuncioModal || !detalhesAnuncioConteudo) return;
    if (detalhesAnuncioTitulo) detalhesAnuncioTitulo.textContent = 'Detalhes do anúncio';

    const imagem = criarImagemAnuncio(anuncio);
    const categoria = document.createElement('span');
    categoria.className = 'anuncio-categoria';
    categoria.textContent = anuncio.categoria;

    const titulo = document.createElement('h3');
    titulo.textContent = anuncio.titulo;

    const descricao = document.createElement('p');
    descricao.className = 'detalhes-anuncio-descricao';
    descricao.textContent = anuncio.descricao;

    const vendedor = document.createElement('p');
    vendedor.className = 'anuncio-vendedor';
    vendedor.textContent = `Publicado por ${anuncio.vendedor}`;

    const dataFormatada = formatarDataAnuncio(anuncio.criadoEm);
    const data = document.createElement('p');
    data.className = 'detalhes-anuncio-data';
    data.textContent = dataFormatada ? `Publicado em ${dataFormatada}` : '';

    const rodape = document.createElement('div');
    rodape.className = 'detalhes-anuncio-rodape';

    const preco = document.createElement('strong');
    preco.textContent = formatarPrecoAnuncio(anuncio.preco);

    const contacto = document.createElement('button');
    contacto.className = 'anuncio-contactar';
    contacto.type = 'button';
    contacto.textContent = 'Contactar vendedor';

    rodape.append(preco, contacto);
    detalhesAnuncioConteudo.replaceChildren(imagem, categoria, titulo, descricao, vendedor, data, rodape);
    contacto.addEventListener('click', () => abrirContactoAnuncio(id));
    if (!detalhesAnuncioModal.open) detalhesAnuncioModal.showModal();
}

function abrirContactoAnuncio(id) {
    const anuncio = anunciosDisponiveis.find((item) => item.id === id);
    if (!anuncio || !detalhesAnuncioModal || !detalhesAnuncioConteudo) return;

    if (detalhesAnuncioTitulo) detalhesAnuncioTitulo.textContent = 'Contactar vendedor';
    const nome = document.createElement('p');
    nome.className = 'contacto-anuncio-vendedor';
    nome.textContent = anuncio.vendedor;

    const contactos = document.createElement('div');
    contactos.className = 'contactos-anuncio-lista';
    const dadosContacto = obterContactosAnuncio(anuncio);

    if (dadosContacto.telefone) {
        const linhaTelefone = document.createElement('p');
        linhaTelefone.className = 'contacto-anuncio-item';
        const etiquetaTelefone = document.createElement('strong');
        etiquetaTelefone.textContent = 'Telemóvel';
        const linkTelefone = document.createElement('a');
        linkTelefone.href = `tel:${dadosContacto.telefone.replace(/[^\d+]/g, '')}`;
        linkTelefone.textContent = dadosContacto.telefone;
        linhaTelefone.append(etiquetaTelefone, linkTelefone);
        contactos.append(linhaTelefone);
    }

    if (dadosContacto.email) {
        const linhaEmail = document.createElement('p');
        linhaEmail.className = 'contacto-anuncio-item';
        const etiquetaEmail = document.createElement('strong');
        etiquetaEmail.textContent = 'Email';
        const linkEmail = document.createElement('a');
        linkEmail.href = `mailto:${encodeURIComponent(dadosContacto.email).replace(/%40/gi, '@')}`;
        linkEmail.textContent = dadosContacto.email;
        linhaEmail.append(etiquetaEmail, linkEmail);
        contactos.append(linhaEmail);
    }

    if (!dadosContacto.telefone && !dadosContacto.email) {
        const semContacto = document.createElement('p');
        semContacto.textContent = 'O vendedor não indicou dados de contacto.';
        contactos.append(semContacto);
    }

    const voltar = document.createElement('button');
    voltar.className = 'anuncio-ver-detalhes';
    voltar.type = 'button';
    voltar.textContent = 'Voltar aos detalhes';
    voltar.addEventListener('click', () => abrirDetalhesAnuncio(id));

    detalhesAnuncioConteudo.replaceChildren(nome, contactos, voltar);
}

async function removerAnuncio(id) {
    const anuncio = anunciosDisponiveis.find((item) => item.id === id);
    if (!anuncio || !utilizadorAdministrador) return;
    if (!window.confirm(`Tem a certeza de que pretende excluir o anúncio "${anuncio.titulo}"?`)) return;

    if (resultadoExclusaoAnuncio) {
        resultadoExclusaoAnuncio.textContent = 'A excluir anúncio...';
        resultadoExclusaoAnuncio.classList.remove('erro');
    }

    try {
        const resposta = await fetch(`/api/anuncios/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' }
        });
        const resultado = await resposta.json();
        if (!resposta.ok) {
            throw new Error(resultado.mensagem || 'Não foi possível excluir o anúncio.');
        }

        if (resultadoExclusaoAnuncio) {
            resultadoExclusaoAnuncio.textContent = resultado.mensagem || 'Anúncio excluído.';
        }
        await carregarAnuncios();
    } catch (error) {
        console.error('Erro ao excluir anúncio:', error);
        if (resultadoExclusaoAnuncio) {
            resultadoExclusaoAnuncio.textContent = error.message || 'Não foi possível excluir o anúncio. Tente novamente.';
            resultadoExclusaoAnuncio.classList.add('erro');
        }
    }
}

function renderizarAnuncios(anuncios) {
    if (!listaAnuncios) return;

    const termo = pesquisaAnuncios ? pesquisaAnuncios.value.trim().toLocaleLowerCase('pt-PT') : '';
    const filtrados = anuncios.filter((anuncio) => {
        const texto = `${anuncio.titulo} ${anuncio.categoria} ${anuncio.descricao} ${anuncio.vendedor}`.toLocaleLowerCase('pt-PT');
        return texto.includes(termo);
    });

    if (!filtrados.length) {
        listaAnuncios.innerHTML = `<p class="anuncios-estado">${termo ? 'Não foram encontrados anúncios para esta pesquisa.' : 'Ainda não existem anúncios. Seja o primeiro a publicar!'}</p>`;
        return;
    }

    listaAnuncios.innerHTML = filtrados.map((anuncio) => {
        const imagem = anuncio.imagem
            ? `<img class="anuncio-imagem" src="${escaparTextoAnuncio(anuncio.imagem)}" alt="${escaparTextoAnuncio(anuncio.titulo)}" loading="lazy">`
            : '<div class="anuncio-imagem anuncio-sem-imagem"><i class="fa-solid fa-leaf" aria-hidden="true"></i><span>Sem fotografia</span></div>';
        const data = formatarDataAnuncio(anuncio.criadoEm);
        return `<article class="anuncio-card">
            ${imagem}
            <div class="anuncio-detalhes">
                <div class="anuncio-etiquetas">
                    <span class="anuncio-categoria">${escaparTextoAnuncio(anuncio.categoria)}</span>
                    ${data ? `<time datetime="${escaparTextoAnuncio(anuncio.criadoEm)}">${data}</time>` : ''}
                </div>
                <h3>${escaparTextoAnuncio(anuncio.titulo)}</h3>
                <p class="anuncio-descricao">${escaparTextoAnuncio(anuncio.descricao)}</p>
                <p class="anuncio-vendedor">Publicado por ${escaparTextoAnuncio(anuncio.vendedor)}</p>
                <div class="anuncio-rodape">
                    <strong>${formatarPrecoAnuncio(anuncio.preco)}</strong>
                    <div class="anuncio-acoes">
                        <button class="anuncio-ver-detalhes" type="button" data-anuncio-id="${escaparTextoAnuncio(anuncio.id)}">Ver detalhes</button>
                        ${utilizadorAdministrador ? `<button class="anuncio-excluir" type="button" data-excluir-anuncio-id="${escaparTextoAnuncio(anuncio.id)}">Excluir</button>` : ''}
                    </div>
                </div>
            </div>
        </article>`;
    }).join('');

    listaAnuncios.querySelectorAll('[data-anuncio-id]').forEach((botao) => {
        botao.addEventListener('click', () => abrirDetalhesAnuncio(botao.getAttribute('data-anuncio-id')));
    });
    listaAnuncios.querySelectorAll('[data-excluir-anuncio-id]').forEach((botao) => {
        botao.addEventListener('click', () => removerAnuncio(botao.getAttribute('data-excluir-anuncio-id')));
    });
}

async function carregarAnuncios() {
    if (!listaAnuncios) return;

    try {
        const resposta = await fetch('/api/anuncios');
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível carregar os anúncios.');
        }
        anunciosDisponiveis = Array.isArray(dados.anuncios) ? dados.anuncios : [];
        renderizarAnuncios(anunciosDisponiveis);
    } catch (error) {
        console.error('Erro ao carregar anúncios:', error);
        listaAnuncios.innerHTML = '<p class="anuncios-estado">Não foi possível carregar os anúncios. Confirme se o servidor está em execução e tente novamente.</p>';
    }
}

async function verificarPermissaoPublicacao() {
    if (!formAnuncio || !secaoPublicarAnuncio) return;

    try {
        const resposta = await fetch('/api/user', {
            headers: { Accept: 'application/json' }
        });
        if (!resposta.ok) {
            throw new Error('Não foi possível verificar as permissões da conta.');
        }

        const dados = await resposta.json();
        utilizadorAdministrador = dados.administrador === true;
        if (dados.administrador === true) {
            secaoPublicarAnuncio.hidden = false;
            formAnuncio.hidden = false;
            renderizarAnuncios(anunciosDisponiveis);
            return;
        }

        secaoPublicarAnuncio.hidden = true;
        renderizarAnuncios(anunciosDisponiveis);
        formAnuncio.hidden = true;
    } catch (error) {
        console.error('Erro ao verificar permissões de publicação:', error);
        utilizadorAdministrador = false;
        secaoPublicarAnuncio.hidden = true;
        renderizarAnuncios(anunciosDisponiveis);
        formAnuncio.hidden = true;
    }
}

if (pesquisaAnuncios) {
    pesquisaAnuncios.addEventListener('input', () => renderizarAnuncios(anunciosDisponiveis));
}

if (inputFotografiaAnuncio) {
    inputFotografiaAnuncio.addEventListener('change', () => {
        const ficheiro = inputFotografiaAnuncio.files && inputFotografiaAnuncio.files[0];
        fotografiaAnuncioDataUrl = '';
        leituraFotografiaEmCurso = false;
        if (previaFotografiaAnuncio) previaFotografiaAnuncio.hidden = true;

        if (!ficheiro) return;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(ficheiro.type)) {
            inputFotografiaAnuncio.value = '';
            if (resultadoAnuncio) {
                resultadoAnuncio.textContent = 'Escolha uma fotografia JPEG, PNG, WebP ou GIF.';
                resultadoAnuncio.classList.add('erro');
            }
            return;
        }
        if (ficheiro.size > tamanhoMaximoFotografiaAnuncio) {
            inputFotografiaAnuncio.value = '';
            if (resultadoAnuncio) {
                resultadoAnuncio.textContent = 'A fotografia deve ter no máximo 5 MB.';
                resultadoAnuncio.classList.add('erro');
            }
            return;
        }

        const leitor = new FileReader();
        leituraFotografiaEmCurso = true;
        leitor.addEventListener('load', () => {
            leituraFotografiaEmCurso = false;
            if (typeof leitor.result !== 'string') return;
            fotografiaAnuncioDataUrl = leitor.result;
            if (imagemPreviaAnuncio) imagemPreviaAnuncio.src = leitor.result;
            if (previaFotografiaAnuncio) previaFotografiaAnuncio.hidden = false;
            if (resultadoAnuncio) {
                resultadoAnuncio.textContent = '';
                resultadoAnuncio.classList.remove('erro');
            }
        });
        leitor.addEventListener('error', () => {
            leituraFotografiaEmCurso = false;
            if (resultadoAnuncio) {
                resultadoAnuncio.textContent = 'Não foi possível ler a fotografia selecionada.';
                resultadoAnuncio.classList.add('erro');
            }
        });
        leitor.readAsDataURL(ficheiro);
    });
}

if (removerFotografiaAnuncio && inputFotografiaAnuncio) {
    removerFotografiaAnuncio.addEventListener('click', () => {
        inputFotografiaAnuncio.value = '';
        fotografiaAnuncioDataUrl = '';
        leituraFotografiaEmCurso = false;
        if (imagemPreviaAnuncio) imagemPreviaAnuncio.removeAttribute('src');
        if (previaFotografiaAnuncio) previaFotografiaAnuncio.hidden = true;
    });
}

if (formAnuncio) {
    formAnuncio.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        if (!formAnuncio.reportValidity()) return;
        if (leituraFotografiaEmCurso) {
            resultadoAnuncio.textContent = 'Aguarde enquanto a fotografia é carregada.';
            resultadoAnuncio.classList.remove('erro');
            return;
        }

        const dados = new FormData(formAnuncio);
        const anuncio = {
            vendedor: dados.get('vendedor').trim(),
            titulo: dados.get('titulo').trim(),
            categoria: dados.get('categoria'),
            preco: Number(dados.get('preco')),
            telefone: dados.get('telefone').trim(),
            email: dados.get('email').trim(),
            fotografia: fotografiaAnuncioDataUrl,
            descricao: dados.get('descricao').trim()
        };

        if (!anuncio.telefone && !anuncio.email) {
            resultadoAnuncio.textContent = 'Indique pelo menos um número de telemóvel ou email para contacto.';
            resultadoAnuncio.classList.add('erro');
            return;
        }

        resultadoAnuncio.textContent = 'A publicar...';
        resultadoAnuncio.classList.remove('erro');

        try {
            const resposta = await fetch('/api/anuncios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(anuncio)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) {
                throw new Error(resultado.mensagem || 'Não foi possível publicar o anúncio.');
            }

            resultadoAnuncio.textContent = resultado.mensagem;
            formAnuncio.reset();
            fotografiaAnuncioDataUrl = '';
            leituraFotografiaEmCurso = false;
            if (imagemPreviaAnuncio) imagemPreviaAnuncio.removeAttribute('src');
            if (previaFotografiaAnuncio) previaFotografiaAnuncio.hidden = true;
            await carregarAnuncios();
        } catch (error) {
            console.error('Erro ao publicar anúncio:', error);
            resultadoAnuncio.textContent = error.message || 'Não foi possível publicar o anúncio. Tente novamente.';
            resultadoAnuncio.classList.add('erro');
        }
    });
}

verificarPermissaoPublicacao();
carregarAnuncios();
