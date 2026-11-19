# Autenticação OAuth Google - José Adriano Garden

Este guia mostra como configurar e rodar a autenticação com Google no seu site.

## Passo 1: Configurar no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (nome: "José Adriano Garden" ou similar)
3. Procure por "OAuth 2.0" na busca superior
4. Clique em "Credenciais"
5. Clique em "Criar Credenciais" → "ID do cliente OAuth 2.0"
6. Escolha "Aplicação da web"
7. Em "URIs de redirecionamento autorizados", adicione:
   - `http://localhost:3000/auth/google/callback`
8. Clique em "Criar"
9. Copie o `Client ID` e `Client Secret`

## Passo 2: Atualizar o arquivo `.env`

Abra `.env` e preencha:
```
GOOGLE_CLIENT_ID=seu_client_id_copiado_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_copiado_aqui
REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=digite_uma_senha_forte_aleatoria
PORT=3000
ADMIN_EMAILS=admin1@exemplo.com,admin2@exemplo.com
```

Em `ADMIN_EMAILS`, indique os emails Google dos criadores/administradores autorizados a publicar anúncios, separados por vírgulas. Só essas contas podem publicar; utilizadores sem sessão ou com outros emails recebem uma resposta de acesso negado. Se a variável não estiver configurada, ninguém poderá publicar. A listagem de anúncios continua pública.

Na loja, os administradores podem selecionar uma fotografia JPEG, PNG, WebP ou GIF do dispositivo ou da galeria (até 5 MB). A imagem é guardada em `imagens/anuncios`; o botão para excluir anúncios só aparece para administradores e a API também confirma essa permissão.

## Passo 3: Instalar dependências

Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

## Passo 4: Rodar o servidor

```bash
npm start
```

Ou para modo desenvolvimento com auto-reload:
```bash
npm run dev
```

O servidor vai rodar em `http://localhost:3000`

Para usar a página de avaliações, mantenha o servidor ativo e abra
`http://localhost:3000/avaliacao.html`. Não abra o ficheiro HTML diretamente
nem use um servidor estático separado, porque as avaliações são carregadas pela
API deste servidor.

## Passo 5: Testar

1. Acesse `http://localhost:3000/login.html`
2. Para criar uma conta do site, selecione "Criar Conta" e preencha o formulário; a sessão é iniciada automaticamente
3. Para uma conta existente, use o email e a senha em "Entrar"
4. A sessão mantém-se ao navegar pelas páginas do site no mesmo navegador e termina ao selecionar "Sair" ou após 24 horas
5. Para publicar anúncios, use "Entrar com Google" com uma conta indicada em `ADMIN_EMAILS`

## Como funciona

- O registo por email cria uma conta no servidor, guarda a senha com hash seguro e inicia sessão automaticamente
- O início de sessão por email verifica a senha no servidor e mantém a sessão ao navegar entre as páginas do site
- A sessão termina ao selecionar "Sair"
- Ao clicar "Entrar com Google", você é redirecionado para `http://localhost:3000/auth/google`
- O servidor redireciona para o Google com seu `client_id`
- Após fazer login no Google, você é redirecionado para `/auth/google/callback`
- O servidor troca o `code` por um `access_token`
- O servidor busca seus dados no Google
- Cria uma sessão no site
- Você é redirecionado para `inicio.html` logado

## Rotas disponíveis

- `/auth/google` - Iniciar login com Google
- `/auth/google/callback` - Callback do Google (automático)
- `/api/user` - Verificar dados do usuário logado
- `POST /api/register` - Criar uma conta e iniciar sessão
- `POST /api/login` - Iniciar sessão com uma conta existente
- `POST /api/anuncios` - Publicar anúncios (apenas administradores listados em `ADMIN_EMAILS`)
- `GET /api/anuncios` - Listar anúncios publicados
- `/api/avaliacoes` - Listar e publicar avaliações
- `/logout` - Fazer logout

## Próximos passos

Você pode:
1. Guardar usuários em um banco de dados
2. Criar um painel de perfil do usuário
3. Integrar com suas outras páginas
4. Adicionar login com Facebook (similar ao Google)

## Dúvidas ou erros?

Se der erro 400/401, verifique:
- Se o `Client ID` e `Client Secret` estão corretos no `.env`
- Se o `REDIRECT_URI` no `.env` bate com o registrado no Google Cloud
- Se o URI autorizado no Google Cloud está exatamente igual ao `REDIRECT_URI` (incluindo protocolo, porta e caminho `/auth/google/callback`)
- Se iniciou o site pelo servidor (`npm start`) e não abrindo o ficheiro HTML diretamente
- Se o servidor está rodando na porta 3000
