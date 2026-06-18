# Opinia — Plataforma de Pesquisa de Opinião Pública

Plataforma profissional de Pesquisa de Opinião Pública e Inteligência Municipal.  
Utilizada exclusivamente pelo administrador para criar pesquisas, gerar tokens/QR Codes, acompanhar respostas e entregar relatórios.

---

## 🧱 Stack Tecnológica

| Camada     | Tecnologia                        |
|------------|-----------------------------------|
| Frontend   | Angular 17 + Angular Material     |
| Backend    | NestJS + TypeScript               |
| Banco      | PostgreSQL 15                     |
| PDF        | PDFKit                            |
| QR Code    | qrcode (Node.js)                  |
| Auth       | JWT (passport-jwt)                |
| Container  | Docker + Docker Compose           |

---

## 🚀 Início Rápido (Local)

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou Docker + Docker Compose
- Node.js 20+ (para desenvolvimento sem Docker)

### 1. Clone / abra o projeto

```bash
cd opinia
```

### 2. Suba todos os serviços

```bash
docker-compose up --build
```

Isso sobe:
- PostgreSQL na porta **5432**
- Backend NestJS na porta **3000**
- Frontend Angular na porta **4200**

### 3. Acesse

| Serviço    | URL                         |
|------------|-----------------------------|
| Frontend   | http://localhost:4200       |
| Backend    | http://localhost:3000       |

### 4. Credenciais padrão

```
E-mail:  admin@opinia.com
Senha:   admin123
```

> ⚠️ Altere as credenciais após o primeiro login em produção.

---

## 💻 Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install
# Configure o .env com DATABASE_URL apontando para seu Postgres local
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 📁 Estrutura do Projeto

```
opinia/
├── backend/
│   ├── src/
│   │   ├── auth/              # JWT Auth
│   │   ├── users/             # Usuário admin
│   │   ├── municipios/        # CRUD municípios + upload brasão
│   │   ├── bairros/           # CRUD bairros
│   │   ├── contratantes/      # CRUD contratantes
│   │   ├── pesquisas/         # CRUD pesquisas
│   │   ├── perguntas/         # Construtor de perguntas + alternativas
│   │   ├── tokens/            # Geração de tokens + lotes
│   │   ├── respostas/         # Registro de respostas anônimas
│   │   ├── relatorios/        # Geração PDF relatório completo
│   │   ├── oficios/           # PDF ofícios + QR Code + PDF controle
│   │   ├── configuracao/      # Configuração da plataforma
│   │   ├── public-survey/     # Portal público (sem auth)
│   │   ├── dashboard/         # Indicadores e gráficos
│   │   └── database/          # Seed inicial
│   └── uploads/               # Arquivos enviados (brasões, logos)
│
├── frontend/
│   └── src/app/
│       ├── core/              # Guards, interceptors, services
│       ├── features/
│       │   ├── auth/          # Tela de login
│       │   ├── shell/         # Layout principal (sidebar + topbar)
│       │   ├── dashboard/     # Dashboard com gráficos
│       │   ├── municipios/    # CRUD municípios
│       │   ├── bairros/       # CRUD bairros
│       │   ├── contratantes/  # CRUD contratantes
│       │   ├── pesquisas/     # CRUD + construtor + distribuição + tokens
│       │   ├── oficios/       # Modelos e geração de ofícios PDF
│       │   └── configuracao/  # Configuração da plataforma
│       └── pages/
│           └── survey/        # Portal público mobile-first
│
└── docker-compose.yml
```

---

## 🔑 Principais Endpoints da API

### Autenticação
```
POST /auth/login
```

### Pesquisas
```
GET    /pesquisas
POST   /pesquisas
GET    /pesquisas/:id
PUT    /pesquisas/:id
DELETE /pesquisas/:id
```

### Tokens
```
POST /tokens/gerar-lote       { pesquisaId, bairroId, quantidade }
GET  /tokens/pesquisa/:id
GET  /tokens/stats/:pesquisaId
```

### Portal Público (sem auth)
```
GET  /s/:token                → carrega pesquisa
POST /s/:token/responder      → submete respostas
```

### Relatórios e Ofícios
```
GET  /relatorios/:pesquisaId            → PDF relatório completo
POST /oficios/gerar/:pesquisaId/modelo/:modeloId → PDF ofícios com QR Code
GET  /oficios/controle/:pesquisaId      → PDF de controle de tokens
```

---

## 🌐 Fluxo do Respondente

```
1. Admin gera tokens para a pesquisa (por bairro, quantidade livre)
2. Admin gera PDF de ofícios (1 página por token, com QR Code impresso)
3. Ofícios são distribuídos fisicamente por agentes no campo
4. Cidadão escaneia o QR Code com celular
5. Browser abre: https://dominio.com/r/X7RMK
6. Interface mobile-first exibe o questionário
7. Cidadão responde e confirma
8. Token é marcado como usado; resposta registrada anonimamente
9. Admin acompanha respostas em tempo real no Dashboard
10. Admin gera Relatório PDF completo com 1 clique
```

---

## 📊 Relatório Automático — Seções

1. **Capa** — nome da pesquisa, município, contratante, estatísticas principais
2. **Metodologia** — método, período, amostragem por bairro
3. **Participação** — convites × respostas, taxa, gráfico por bairro
4. **Resultados Gerais** — análise de cada pergunta com gráficos de barras
5. **Resultados por Bairro** — breakdown geográfico das respostas
6. **Módulo Eleitoral** — questões eleitorais (quando aplicável)
7. **Ranking de Problemas** — perguntas classificadas por criticidade
8. **Índice Municipal** — score 0–100 baseado em escalas coletadas
9. **Conclusão** — texto gerado automaticamente

---

## ⚙️ Configuração da Plataforma

Na tela **Configuração** é possível alterar:
- Nome da plataforma (exibido em ofícios e relatórios)
- Logo (upload de imagem PNG/JPG)
- Texto institucional padrão
- Rodapé padrão
- URL pública (usada nos QR Codes)

---

## 🚀 Deploy em VPS Hostinger (Produção)

```bash
# 1. Clone o projeto no servidor
git clone <repo> opinia && cd opinia

# 2. Ajuste as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite DATABASE_URL, JWT_SECRET, PUBLIC_URL, FRONTEND_URL

# 3. Suba em produção
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Configure Nginx como reverse proxy
#    - /         → frontend:4200
#    - /api      → backend:3000
#    - /uploads  → backend:3000/uploads
```

---

## 🔐 Segurança

- JWT com expiração de 24h
- Senhas com bcrypt (salt 10)
- Respostas completamente anônimas (sem nome, CPF, telefone ou e-mail)
- Cada token só pode ser usado uma única vez
- Tokens usam apenas caracteres não-ambíguos (sem 0, O, I, l)

---

## 📝 Licença

Uso privado. Todos os direitos reservados.
