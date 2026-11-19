require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;
const avaliacaoFilePath = path.join(__dirname, 'data', 'avaliacoes.json');
const anunciosFilePath = path.join(__dirname, 'data', 'anuncios.json');
const imagensAnunciosDir = path.join(__dirname, 'imagens', 'anuncios');
const utilizadoresFilePath = path.join(__dirname, 'data', '.utilizadores.json');
const derivarChave = promisify(crypto.scrypt);
const tamanhoMaximoImagemAnuncio = 5 * 1024 * 1024;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

function utilizadorEAdministrador(req) {
  const user = req.session.user;
  return user?.provider === 'google'
    && typeof user.email === 'string'
    && adminEmails.has(user.email.trim().toLowerCase());
}

function lerUtilizadores() {
  const conteudo = fs.readFileSync(utilizadoresFilePath, 'utf8').replace(/^\uFEFF/, '');
  const utilizadores = JSON.parse(conteudo);
  if (!Array.isArray(utilizadores)) {
    throw new Error('O ficheiro de utilizadores tem um formato inválido.');
  }
  return utilizadores;
}

function guardarUtilizadores(utilizadores) {
  fs.writeFileSync(utilizadoresFilePath, JSON.stringify(utilizadores, null, 2));
}

function regenerarSessao(req, utilizador) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erro) => {
      if (erro) {
        reject(erro);
        return;
      }

      req.session.user = utilizador;
      req.session.save((erroGuardar) => {
        if (erroGuardar) {
          reject(erroGuardar);
          return;
        }
        resolve();
      });
    });
  });
}

function utilizadorPublico(utilizador) {
  return {
    id: utilizador.id,
    name: utilizador.name,
    email: utilizador.email,
    provider: utilizador.provider,
  };
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'seu_secret_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '7mb' }));

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const nome = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
  const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique um nome e um email válidos.' });
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ sucesso: false, mensagem: 'A senha deve ter entre 8 e 128 caracteres.' });
  }

  if (adminEmails.has(emailNormalizado)) {
    return res.status(403).json({ sucesso: false, mensagem: 'Esta conta de administrador deve iniciar sessão com Google.' });
  }

  try {
    if (lerUtilizadores().some((utilizador) => utilizador.email === emailNormalizado)) {
      return res.status(409).json({ sucesso: false, mensagem: 'Já existe uma conta com este email.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await derivarChave(password, salt, 64);
    const utilizadores = lerUtilizadores();
    if (utilizadores.some((utilizador) => utilizador.email === emailNormalizado)) {
      return res.status(409).json({ sucesso: false, mensagem: 'Já existe uma conta com este email.' });
    }

    const novoUtilizador = {
      id: crypto.randomUUID(),
      name: nome,
      email: emailNormalizado,
      passwordSalt: salt,
      passwordHash: hash.toString('hex'),
      createdAt: new Date().toISOString(),
    };

    utilizadores.push(novoUtilizador);
    guardarUtilizadores(utilizadores);

    const utilizadorSessao = { ...utilizadorPublico(novoUtilizador), provider: 'local' };
    await regenerarSessao(req, utilizadorSessao);
    res.status(201).json({ sucesso: true, mensagem: 'Conta criada e sessão iniciada.', user: utilizadorSessao });
  } catch (erro) {
    console.error('Erro ao criar conta:', erro.message);
    res.status(500).json({ sucesso: false, mensagem: 'Não foi possível criar a conta. Tente novamente.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailNormalizado = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado) || typeof password !== 'string') {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique um email e uma senha válidos.' });
  }

  try {
    const utilizador = lerUtilizadores().find((item) => item.email === emailNormalizado);
    if (!utilizador) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos.' });
    }

    const hashRecebido = await derivarChave(password, utilizador.passwordSalt, 64);
    const hashGuardado = Buffer.from(utilizador.passwordHash, 'hex');
    if (hashRecebido.length !== hashGuardado.length || !crypto.timingSafeEqual(hashRecebido, hashGuardado)) {
      return res.status(401).json({ sucesso: false, mensagem: 'Email ou senha incorretos.' });
    }

    const utilizadorSessao = { ...utilizadorPublico(utilizador), provider: 'local' };
    await regenerarSessao(req, utilizadorSessao);
    res.json({ sucesso: true, mensagem: 'Sessão iniciada com sucesso.', user: utilizadorSessao });
  } catch (erro) {
    console.error('Erro ao iniciar sessão:', erro.message);
    res.status(500).json({ sucesso: false, mensagem: 'Não foi possível iniciar sessão. Tente novamente.' });
  }
});

function readAvaliacoes() {
  try {
    const raw = fs.readFileSync(avaliacaoFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeAvaliacoes(avaliacoes) {
  fs.writeFileSync(avaliacaoFilePath, JSON.stringify(avaliacoes, null, 2));
}

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'inicio.html'));
});

app.get('/api/avaliacoes', (req, res) => {
  const avaliacoes = readAvaliacoes();
  res.json({ avaliacoes });
});

app.post('/api/avaliacoes', (req, res) => {
  const { avaliacao, comentario, nome } = req.body;

  const rating = Number(avaliacao);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ sucesso: false, mensagem: 'Avaliação inválida. Escolha entre 1 e 5 estrelas.' });
  }

  const nomeLimpo = typeof nome === 'string'
    ? nome.trim().replace(/\s+/g, ' ').slice(0, 80)
    : '';

  if (!nomeLimpo) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique o seu nome para publicar a avaliação.' });
  }

  const comentarioLimpo = typeof comentario === 'string'
    ? comentario.trim().slice(0, 500)
    : '';

  const agora = new Date();
  const novaAvaliacao = {
    id: Date.now().toString(36) + '-' + Math.round(Math.random() * 1_000_000),
    avaliacao: rating,
    nome: nomeLimpo,
    comentario: comentarioLimpo,
    data: agora.toISOString(),
    criadaEm: agora.toISOString(),
  };

  const avaliacoes = readAvaliacoes();
  avaliacoes.unshift(novaAvaliacao);
  writeAvaliacoes(avaliacoes);

  res.status(201).json({ sucesso: true, mensagem: 'Avaliação enviada com sucesso.', avaliacao: novaAvaliacao });
});

app.get('/api/anuncios', (req, res) => {
  const anuncios = JSON.parse(fs.readFileSync(anunciosFilePath, 'utf8'));
  if (!Array.isArray(anuncios)) {
    throw new Error('O ficheiro de anúncios tem um formato inválido.');
  }
  res.json({ anuncios });
});

app.post('/api/anuncios', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ sucesso: false, mensagem: 'Inicie sessão com Google para publicar anúncios.' });
  }

  if (!utilizadorEAdministrador(req)) {
    return res.status(403).json({ sucesso: false, mensagem: 'Apenas os administradores podem publicar anúncios.' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Os dados do anúncio são inválidos.' });
  }

  const { vendedor, titulo, categoria, preco, descricao, telefone: telefoneRecebido, email: emailRecebido, contacto, fotografia } = req.body;
  const categorias = ['Plantas', 'Sementes', 'Ferramentas', 'Vasos e decoração', 'Outros'];
  const vendedorLimpo = typeof vendedor === 'string' ? vendedor.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
  const tituloLimpo = typeof titulo === 'string' ? titulo.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
  const descricaoLimpa = typeof descricao === 'string' ? descricao.trim().slice(0, 1000) : '';
  let telefoneLimpo = typeof telefoneRecebido === 'string' ? telefoneRecebido.trim().slice(0, 30) : '';
  let emailLimpo = typeof emailRecebido === 'string' ? emailRecebido.trim().slice(0, 120) : '';
  if (!telefoneLimpo && !emailLimpo && typeof contacto === 'string') {
    const contactoAntigo = contacto.trim().slice(0, 120);
    if (contactoAntigo.includes('@')) {
      emailLimpo = contactoAntigo;
    } else {
      telefoneLimpo = contactoAntigo;
    }
  }
  let caminhoImagem = '';

  if (vendedorLimpo.length < 2 || tituloLimpo.length < 3 || !categorias.includes(categoria)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique o seu nome, um produto válido e uma categoria.' });
  }

  if (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0 || preco > 99999999) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique um preço válido.' });
  }

  if (descricaoLimpa.length < 10) {
    return res.status(400).json({ sucesso: false, mensagem: 'A descrição deve ter pelo menos 10 caracteres.' });
  }

  if (!telefoneLimpo && !emailLimpo) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique pelo menos um número de telemóvel ou email para contacto.' });
  }

  if (telefoneLimpo && (!/^[+\d\s().-]+$/.test(telefoneLimpo)
    || telefoneLimpo.replace(/\D/g, '').length < 9
    || telefoneLimpo.replace(/\D/g, '').length > 15)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique um número de telemóvel válido.' });
  }

  if (emailLimpo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Indique um email válido.' });
  }

  if (fotografia) {
    if (typeof fotografia !== 'string') {
      return res.status(400).json({ sucesso: false, mensagem: 'O ficheiro da fotografia é inválido.' });
    }

    const correspondencia = fotografia.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!correspondencia) {
      return res.status(400).json({ sucesso: false, mensagem: 'Escolha uma fotografia JPEG, PNG, WebP ou GIF válida.' });
    }

    const [, tipoImagem, conteudoBase64] = correspondencia;
    const bufferImagem = Buffer.from(conteudoBase64, 'base64');
    if (!bufferImagem.length || bufferImagem.length > tamanhoMaximoImagemAnuncio) {
      return res.status(400).json({ sucesso: false, mensagem: 'A fotografia deve ter no máximo 5 MB.' });
    }

    const assinaturasValidas = {
      'image/jpeg': bufferImagem.length >= 3 && bufferImagem[0] === 0xff && bufferImagem[1] === 0xd8 && bufferImagem[2] === 0xff,
      'image/png': bufferImagem.length >= 8 && bufferImagem.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      'image/webp': bufferImagem.length >= 12 && bufferImagem.toString('ascii', 0, 4) === 'RIFF' && bufferImagem.toString('ascii', 8, 12) === 'WEBP',
      'image/gif': bufferImagem.length >= 6 && ['GIF87a', 'GIF89a'].includes(bufferImagem.toString('ascii', 0, 6)),
    };
    if (!assinaturasValidas[tipoImagem]) {
      return res.status(400).json({ sucesso: false, mensagem: 'O conteúdo do ficheiro não corresponde a uma fotografia válida.' });
    }

    const extensoesImagem = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    try {
      fs.mkdirSync(imagensAnunciosDir, { recursive: true });
      const nomeImagem = `${crypto.randomUUID()}${extensoesImagem[tipoImagem]}`;
      fs.writeFileSync(path.join(imagensAnunciosDir, nomeImagem), bufferImagem, { flag: 'wx' });
      caminhoImagem = `/imagens/anuncios/${nomeImagem}`;
    } catch (error) {
      console.error('Erro ao guardar fotografia do anúncio:', error.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível guardar a fotografia do anúncio.' });
    }
  }

  const agora = new Date().toISOString();
  const novoAnuncio = {
    id: Date.now().toString(36) + '-' + Math.round(Math.random() * 1_000_000),
    vendedor: vendedorLimpo,
    titulo: tituloLimpo,
    categoria,
    preco: Math.round(preco * 100) / 100,
    descricao: descricaoLimpa,
    telefone: telefoneLimpo,
    email: emailLimpo,
    contacto: telefoneLimpo || emailLimpo,
    imagem: caminhoImagem,
    criadoEm: agora,
  };
  const anuncios = JSON.parse(fs.readFileSync(anunciosFilePath, 'utf8'));
  if (!Array.isArray(anuncios)) {
    if (caminhoImagem) {
      try {
        fs.unlinkSync(path.join(imagensAnunciosDir, path.basename(caminhoImagem)));
      } catch (error) {
        console.error('Erro ao limpar fotografia de anúncio inválido:', error.message);
      }
    }
    throw new Error('O ficheiro de anúncios tem um formato inválido.');
  }
  anuncios.unshift(novoAnuncio);
  try {
    fs.writeFileSync(anunciosFilePath, JSON.stringify(anuncios, null, 2));
  } catch (error) {
    if (caminhoImagem) {
      try {
        fs.unlinkSync(path.join(__dirname, caminhoImagem.slice(1)));
      } catch (erroRemocao) {
        console.error('Erro ao limpar fotografia após falha ao guardar anúncio:', erroRemocao.message);
      }
    }
    console.error('Erro ao guardar anúncio:', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível guardar o anúncio.' });
  }

  res.status(201).json({ sucesso: true, mensagem: 'Anúncio publicado com sucesso.', anuncio: novoAnuncio });
});

app.delete('/api/anuncios/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ sucesso: false, mensagem: 'Inicie sessão com Google para remover anúncios.' });
  }

  if (!utilizadorEAdministrador(req)) {
    return res.status(403).json({ sucesso: false, mensagem: 'Apenas os administradores podem remover anúncios.' });
  }

  let anuncios;
  try {
    anuncios = JSON.parse(fs.readFileSync(anunciosFilePath, 'utf8'));
  } catch (error) {
    console.error('Erro ao ler anúncios para remoção:', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível carregar os anúncios para remoção.' });
  }

  if (!Array.isArray(anuncios)) {
    return res.status(500).json({ sucesso: false, mensagem: 'O ficheiro de anúncios tem um formato inválido.' });
  }

  const indice = anuncios.findIndex((anuncio) => anuncio.id === req.params.id);
  if (indice === -1) {
    return res.status(404).json({ sucesso: false, mensagem: 'Anúncio não encontrado.' });
  }

  const [removido] = anuncios.splice(indice, 1);
  try {
    fs.writeFileSync(anunciosFilePath, JSON.stringify(anuncios, null, 2));
  } catch (error) {
    console.error('Erro ao guardar anúncios após remoção:', error.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível remover o anúncio.' });
  }

  if (typeof removido.imagem === 'string' && /^\/imagens\/anuncios\/[a-f0-9-]+\.(?:jpg|png|webp|gif)$/i.test(removido.imagem)) {
    try {
      fs.unlinkSync(path.join(imagensAnunciosDir, path.basename(removido.imagem)));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Erro ao remover fotografia do anúncio:', error.message);
      }
    }
  }

  res.json({ sucesso: true, mensagem: 'Anúncio removido com sucesso.', anuncio: removido });
});

app.delete('/api/avaliacoes/:id', (req, res) => {
  const { id } = req.params;
  const avaliacoes = readAvaliacoes();
  const indice = avaliacoes.findIndex((item) => item.id === id);

  if (indice === -1) {
    return res.status(404).json({ sucesso: false, mensagem: 'Avaliação não encontrada.' });
  }

  const [removida] = avaliacoes.splice(indice, 1);
  writeAvaliacoes(avaliacoes);

  res.json({ sucesso: true, mensagem: 'Avaliação removida com sucesso.', removida });
});

// Rota de login com Google
app.get('/auth/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect('/login.html?error=google_not_configured');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Rota de callback do Google
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  const error = req.query.error;

  if (error) {
    return res.redirect('/login.html?error=auth_failed');
  }

  if (typeof code !== 'string' || !code) {
    return res.redirect('/login.html?error=missing_code');
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect('/login.html?error=google_not_configured');
  }

  try {
    const tokenData = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = tokenResponse.data;

    // Buscar informações do usuário
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const user = userResponse.data;

    await regenerarSessao(req, {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
    });

    // Redirecionar para inicio.html com sucesso
    res.redirect('/inicio.html?login=success');
  } catch (error) {
    console.error('Erro ao fazer login com Google:', error.response?.data?.error || error.message);
    res.redirect('/login.html?error=server_error');
  }
});

// Rota para verificar se o usuário está logado
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ logado: true, administrador: utilizadorEAdministrador(req), user: req.session.user });
  } else {
    res.json({ logado: false, administrador: false });
  }
});

// Rota para logout
app.get('/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      console.error('Erro ao terminar sessão:', erro.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Não foi possível terminar a sessão.' });
    }
    res.clearCookie('connect.sid');
    if (req.accepts('html')) {
      return res.redirect('/login.html');
    }
    res.json({ sucesso: true, mensagem: 'Sessão terminada.' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
