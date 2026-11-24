<p align="left">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Logo" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Logo" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Logo" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Logo" />
</p>

# Sistema CRESCE

Trabalho da disciplina de Modelagem de Sistemas.

## Integrantes

- Breno Loureiro
- Fernanda Coutinho
- Isabelly Silva
- Juliana Lindebeck

## Instruções para executar

Requisitos: Node.js 20 ou mais recente.

### 1. Instalar as dependências

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configurar o backend

Copie `backend/.env.example` para `backend/.env` e defina pelo menos `JWT_SECRET` (um texto longo e aleatório).
Sem `SMTP_USER`/`SMTP_PASS`, o sistema roda em **modo demonstração**: nenhum e-mail é enviado e a senha de cada usuário cadastrado aparece uma única vez para quem fez o cadastro.

### 3. (Opcional) Recriar os dados de demonstração

```bash
cd backend
SEED_PASSWORD=<senha-das-contas-demo> npm run seed
```

No PowerShell: `$env:SEED_PASSWORD="<senha>"; npm run seed`. Reinicie o json-server depois de rodar a semente.

### 4. Rodar (3 terminais)

```bash
# Terminal 1 - banco (json-server, porta 3001; acessado só pelo backend)
cd backend
npm run json-server

# Terminal 2 - API NestJS (porta 3000)
cd backend
npm run start:dev

# Terminal 3 - frontend (porta 5173)
cd frontend
npm run dev
```

O frontend usa `VITE_API_URL` (padrão `http://localhost:3000`; veja `frontend/.env.example`).

### 5. Testes

```bash
cd backend
npm run test:e2e
```

Material da apresentação e roteiro de avaliação de usabilidade: [docs/apresentacao.md](docs/apresentacao.md).
