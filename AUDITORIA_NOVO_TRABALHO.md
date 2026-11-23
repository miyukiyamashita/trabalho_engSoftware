# AUDITORIA DO PROJETO — Sistema CRESCE × Novo Trabalho de Engenharia de Software

> **Escopo:** diagnóstico do código atual frente a `trabalho_ES.pdf` (referencial teórico de Engenharia de Requisitos e IHC) e `trabalho_ES (1).pdf` (personas, RF01–RF14, RNF01–RNF08 e heurísticas — **referência principal**).
> **Data:** 23/11/2026 · **Branch analisada:** `claude/sistemacresce-project-audit-f50e83` (commit `68dc335`).
> **Restrição respeitada:** nenhum arquivo de código, banco, dependência ou configuração foi alterado. O único arquivo criado é este documento.

### Como ler este documento

- **Método:** análise estática de todo o código-fonte (backend NestJS, servidor de relatórios Express, frontend React, banco `db.json`). As dependências **não estão instaladas** (`node_modules` ausente) e a instrução era não instalar nada; por isso **nenhum fluxo foi executado**. Toda classificação de "implementado/funcional" significa: *o código existe e está integrado entre interface → API → persistência*. Comportamento em tempo de execução, desempenho e compatibilidade de navegadores estão marcados como **NÃO VALIDADO** quando dependem de execução.
- **Evidências** aparecem como `caminho/arquivo:linha`. Os números de linha referem-se ao commit `68dc335`.
- Dúvidas sobre comportamento que não puderam ser confirmadas pelo código estão marcadas com **❓ Dúvida**.

---

## Sumário

1. [Resumo executivo](#1-resumo-executivo)
2. [Diagnóstico técnico: arquitetura e tecnologias](#2-diagnóstico-técnico-arquitetura-e-tecnologias)
3. [Inventário de funcionalidades](#3-inventário-de-funcionalidades)
4. [Matriz dos 14 requisitos funcionais](#4-matriz-dos-14-requisitos-funcionais)
5. [Matriz dos 8 requisitos não funcionais](#5-matriz-dos-8-requisitos-não-funcionais)
6. [Matriz de permissões por perfil](#6-matriz-de-permissões-por-perfil)
7. [Avaliação das quatro personas](#7-avaliação-das-quatro-personas)
8. [Avaliação das 10 heurísticas de Nielsen](#8-avaliação-das-10-heurísticas-de-nielsen)
9. [Proposta de avaliação de usabilidade por persona](#9-proposta-de-avaliação-de-usabilidade-por-persona)
10. [EXEMPLOS PARA APRESENTAÇÃO](#10-exemplos-para-apresentação)
11. [Problemas técnicos encontrados](#11-problemas-técnicos-encontrados)
12. [Matriz geral de aderência ao trabalho](#12-matriz-geral-de-aderência-ao-trabalho)
13. [Plano de implementação priorizado](#13-plano-de-implementação-priorizado)
14. [Reaproveitar × desenvolver](#14-reaproveitar--desenvolver)
15. [Conclusão objetiva](#15-conclusão-objetiva)

---

## 1. Resumo executivo

O Sistema CRESCE já cobre **todos os 14 requisitos funcionais em algum grau**: há telas, rotas de API e persistência para solicitação de cadastro de escolas, aprovação pelo administrador do sistema, cadastro de professores/alunos/turmas/disciplinas, avisos com confirmação de leitura, lançamento de notas, chamada e geração de relatório final em PDF. A interface é organizada por perfil, com menu lateral próprio para cada um, e já contém vários exemplos reais de heurísticas de Nielsen que podem ser usados na apresentação.

Os principais pontos fracos são de **segurança e arquitetura**, não de funcionalidade:

- O frontend lê e grava **diretamente no json-server (porta 3001)** em 59 chamadas, sem passar pela API NestJS. Qualquer pessoa na rede consegue, por exemplo, abrir `http://localhost:3001/usuarios` e ver **todas as senhas em texto puro**.
- **Nenhum endpoint do backend exige autenticação ou verifica perfil**. A única rota protegida é `GET /auth/me`. A separação entre perfis existe **só na interface** (`ProtectedRoute`).
- Senhas são gravadas e comparadas em texto puro. O `bcrypt` está instalado, mas não é usado. Segredos (chave JWT e senha de app do Gmail) estão gravados no código versionado.
- As **edições** previstas em RF04 e RF06–RF09 não têm interface: só é possível cadastrar e excluir.

| Indicador | Resultado |
|---|---|
| RFs implementados de ponta a ponta (código) | **8 de 14** (RF01, RF02, RF03, RF05, RF10, RF11, RF12, RF13) |
| RFs parciais | **6 de 14** (RF04, RF06, RF07, RF08, RF09, RF14) |
| RFs ausentes | **0** |
| RNFs atendidos / parciais / não atendidos / não validados | **1 / 4 / 2 / 1** |
| Aproveitamento estimado do código atual | **cerca de 70%** (detalhes na seção 14) |
| Testes automatizados | 1 teste e2e padrão, **desatualizado** (falharia) |

---

## 2. Diagnóstico técnico: arquitetura e tecnologias

### 2.1 Tecnologias e versões (declaradas em `package.json`)

| Camada | Tecnologia | Versão declarada | Observação |
|---|---|---|---|
| Frontend | React | ^19.2.6 | SPA |
| Frontend | Vite | ^8.0.12 | `npm run dev` |
| Frontend | TypeScript | ~6.0.2 | |
| Frontend | react-router-dom | ^7.17.0 | Rotas em `frontend/src/routes/AppRoutes.tsx` |
| Frontend | axios | ^1.17.0 | Instância `api.ts` criada, mas **não usada em nenhuma tela** |
| Frontend | react-select | ^5.10.2 | Multiseleção de alunos, disciplinas e turmas |
| Frontend | react-icons | ^5.6.0 | Ícones do menu e dos cards |
| Frontend | `@nestjs/passport`, `passport`, `passport-jwt` | — | Dependências de backend declaradas no frontend sem uso |
| Backend | NestJS | ^11.0.1 | API na porta **3000** (`backend/src/main.ts:7`) |
| Backend | @nestjs/jwt + passport-jwt | ^11 / ^4 | JWT com validade de 1 dia |
| Backend | json-server | ^1.0.0-beta.15 | "Banco" na porta **3001** (`backend/package.json:21`) sobre `backend/database/db.json` |
| Backend | nodemailer | ^9.0.1 | Envio de credenciais via Gmail |
| Backend | bcrypt | ^6.0.0 | **Instalado, nunca importado** |
| Backend | class-validator / class-transformer | ^0.15 / ^0.5 | **Instalados, sem `ValidationPipe`** |
| Relatórios | Express + PDFKit (`backend/server.js`) | ^5.2.1 / ^0.19.1 | Servidor separado na porta **3002** |
| Testes | Jest + Supertest | ^30 / ^7 | 1 arquivo e2e padrão |

### 2.2 Arquitetura atual

```
 Navegador (React, :5173)
   │  ├──(47 chamadas)──► NestJS :3000 ──axios──► json-server :3001 ──► db.json
   │  ├──(59 chamadas)───────────────────────────► json-server :3001   (acesso direto!)
   │  └──(2 chamadas)───► Express :3002 (gera PDFs; serve /relatorios como pasta pública)
   │                               └──axios──► json-server :3001
   └─ token JWT em localStorage (usado só em /auth/me)
```

- **Quatro processos** precisam estar no ar para a demonstração (Vite, NestJS, json-server e `node server.js`), conforme o `README.md`.
- **Camadas do backend:** cada módulo tem `controller` → `service` → chamada HTTP ao json-server com axios. Não há camada de repositório, DTOs validados, guards ou interceptors.
- **Classes de domínio** (`backend/src/classes/*`) não correspondem ao formato realmente gravado. Exemplos: `Aluno.nome` × `nomeAluno` gravado; `Disciplina.nome` × `nomeDisciplina`. `RelatorioFinal.ts` está vazio e `Responsavel` não é usado. Elas servem mais como documentação do modelo UML da disciplina anterior.

### 2.3 Modelo de dados (`backend/database/db.json`)

Coleções: `usuarios`, `alunos`, `professores`, `responsaveis` (nunca usada), `turmas`, `disciplinas`, `avisos`, `solicitacoesCadastro`, `solicitacoesEdicao`, `solicitacoesRemocao`, `escolas`, `administradoresEscolares`, `notas`, `frequencia`.

**Estado atual do banco:** só `usuarios` tem registros: 4 contas de semente, uma por perfil (`adminsistema@`, `adminescolar@`, `prof@`, `responsavel@cresce.com`). As outras coleções estão vazias. As contas de semente de admin escolar, professor e responsável **não têm o registro correspondente** em `administradoresEscolares`, `professores` ou `alunos`, então essas telas abrem vazias.

**Relacionamentos (como estão implementados):**

| Relação | Como é feita | Risco |
|---|---|---|
| Escola → alunos | `escola.alunos[]` guarda **CPFs** (`alunos.service.ts:67`) | Mesmo CPF em duas escolas |
| Escola → professores | `escola.professores[]` guarda **CPFs** (`professores.service.ts:66`) | Idem |
| Escola → disciplinas | `escola.disciplinas[]` guarda **códigos** (`disciplinas.service.ts:41`) | Código "MAT101" em duas escolas colide |
| Escola → turmas | `escola.turmas[]` guarda **nomes** (`turmas.service.ts:39`) | "9º Ano A" em duas escolas colide |
| Escola → avisos | `escola.avisos[]` guarda a **data de criação** (`avisos.service.ts:38`) | Chave temporal como identificador |
| Turma → alunos/disciplinas | arrays de IDs | — |
| Disciplina → professor | `disciplina.professorId` | Professor é vinculado à turma só indiretamente |
| Aluno → responsável | `aluno.emailResponsavel` + `usuario` com o mesmo e-mail | Um responsável com dois filhos gera dois usuários com o mesmo e-mail |
| Usuário ↔ perfil | `usuarios.id` recebe o mesmo número do registro de perfil (`alunos.service.ts:53`) | IDs de coleções diferentes podem colidir em `usuarios` (❓ comportamento do json-server com ID repetido não verificado) |

Nenhuma entidade guarda `escolaId` (exceto `administradoresEscolares`). O isolamento entre escolas depende das listas acima.

### 2.4 Autenticação e autorização

- `POST /auth/login` (`backend/src/auth/auth.service.ts:11-36`) baixa **todos** os usuários do json-server e compara `email` e `senha` em texto puro (linha 18). Gera um JWT com `sub`, `email` e `tipo`.
- O segredo `'cresce-secret'` está fixo no código (`auth.module.ts:13`, `jwt.strategy.ts:11`).
- `JwtAuthGuard` só é aplicado em `GET /auth/me` (`auth.controller.ts:20`). **Nenhum outro controller usa guard.**
- No frontend, `ProtectedRoute` (`frontend/src/routes/ProtectedRoute.tsx`) bloqueia rotas por `user.tipo`, mas as telas identificam o usuário por `localStorage.usuario_email` (gravado em `Login/page.tsx:32`), um valor que o próprio usuário pode alterar.
- **Logout não encerra a sessão:** o botão "Sair" de todos os menus é um `<Link to="/login">` (ex.: `SidebarAdminEscolar.tsx:49`). A função `logout()` (`AuthContext.tsx:35`) nunca é chamada, e o token continua no `localStorage`.

### 2.5 Integrações externas

| Integração | Onde | Observação |
|---|---|---|
| Gmail (SMTP via nodemailer) | `backend/src/email/email.service.ts:8-14` | Credenciais fixas no código. É a **única forma** de o usuário receber a senha gerada |
| Google Fonts | `frontend/index.html` | Plus Jakarta Sans |

### 2.6 Testes

- `backend/test/app.e2e-spec.ts` espera `'Hello World!'`, mas `AppController` retorna `{ message: 'Backend funcionando!' }` (`app.controller.ts:7-9`). **O teste falharia.**
- Não há testes unitários (`*.spec.ts` em `src`) nem testes de frontend. **Cobertura efetiva: 0%.**

---

## 3. Inventário de funcionalidades

| # | Funcionalidade | Perfil | Tela (rota) | API / persistência | Estado |
|---|---|---|---|---|---|
| F1 | Página inicial institucional | Público | `/` — `Home/TelaInicial.tsx` | — | Funcional |
| F2 | Solicitar cadastro de escola | Público (futuro admin escolar) | `/telacadastro` — `Home/TelaCadastro.tsx` | `POST /solicitacoes-cadastro` → `solicitacoesCadastro` | Funcional |
| F3 | Login | Todos | `/login` — `Login/page.tsx` | `POST /auth/login`, `GET /auth/me` | Funcional (sem logout real) |
| F4 | Dashboard do admin do sistema (contadores) | Admin Sistema | `/admin-sistema` — `AdminSistema/page.tsx` | lê o json-server direto | Funcional |
| F5 | Analisar solicitações (cadastro/edição/remoção) | Admin Sistema | `/admin-sistema/solicitacoes` — `Solicitacoes.tsx` | `PATCH /solicitacoes-*/:id/status` | Funcional |
| F6 | Aprovação cria escola + admin escolar + e-mail | Admin Sistema | idem | `solicitacao-cadastro.service.ts:61-98` | Funcional (depende do SMTP) |
| F7 | Aprovação de remoção apaga a escola em cascata | Admin Sistema | idem | `solicitacao-remocao.service.ts:48-160` | Funcional, com risco de apagar dados de outras escolas (seção 11) |
| F8 | Listar escolas | Admin Sistema | `/admin-sistema/escolas` — `Escolas.tsx` | `GET /escolas` | Funcional (somente leitura) |
| F9 | Dashboard da escola (contadores) | Admin Escolar | `/admin-escolar/dashboard` — `AdminEscolar.tsx` | json-server direto | Funcional |
| F10 | Ver dados da escola + solicitar edição/remoção | Admin Escolar | `/admin-escolar/escola` — `Escola.tsx` | `POST /solicitacoes-edicao`, `POST /solicitacoes-remocao` | Funcional |
| F11 | Cadastrar / listar / excluir professores | Admin Escolar | `/admin-escolar/professores` | `POST/GET/DELETE /professores` | Sem edição |
| F12 | Cadastrar / listar / excluir alunos + responsável | Admin Escolar | `/admin-escolar/alunos` | `POST/GET/DELETE /alunos` | Sem edição |
| F13 | Cadastrar / listar turmas; detalhes; excluir; remover aluno/disciplina da turma | Admin Escolar | `/admin-escolar/turmas`, `/admin-escolar/turmas/:id` | `POST/GET/DELETE /turmas`, `PATCH /turmas/:id/remover-*` | Sem edição e sem incluir alunos depois de criada |
| F14 | Cadastrar / listar / excluir disciplinas (com professor) | Admin Escolar | `/admin-escolar/disciplinas` | `POST/GET/DELETE /disciplinas` | Sem edição |
| F15 | Enviar avisos por turma + ver leituras | Admin Escolar | `/admin-escolar/avisos` | `POST /avisos` | Funcional |
| F16 | Gerar relatórios finais (PDF) | Admin Escolar | `/admin-escolar/relatoriofinal` | `POST :3002/api/gerar-relatorios` | Gera para **todos os alunos de todas as escolas** |
| F17 | Dashboard do professor | Professor | `/prof/dashboard` — `Prof/Dashboard.tsx` | json-server direto | Funcional |
| F18 | Lançar/atualizar notas por turma e disciplina | Professor | `/prof/notas` — `Prof/Notas.tsx` | `GET /notas/turma/:id`, `POST /notas/lancar` | Funcional |
| F19 | Registrar frequência por turma, disciplina e data | Professor | `/prof/frequencia` — `Prof/Frequencia.tsx` | `GET /frequencia/buscar`, `POST /frequencia/registrar` | Funcional |
| F20 | Enviar e ver avisos das suas turmas | Professor | `/prof/avisos` — `Prof/Avisos.tsx` | grava **direto** no json-server | Funcional (fora da API) |
| F21 | Dashboard do responsável (média, frequência, avisos) | Responsável | `/responsavel` — `Responsavel/page.tsx` | json-server direto + `GET /avisos/responsavel/:email` | Funcional |
| F22 | Ver notas (boletim) | Responsável | `/responsavel/notas` | json-server direto | Funcional (cálculo inconsistente) |
| F23 | Ver frequência por disciplina | Responsável | `/responsavel/frequencia` | json-server direto | Funcional |
| F24 | Ver avisos, filtrar e marcar como lido | Responsável | `/responsavel/avisos` | `GET /avisos/responsavel/:email`, `PUT /avisos/:id` | Funcional |
| F25 | Baixar relatório final | Responsável | `/responsavel/relatoriofinal` | `GET :3002/relatorios/relatorio_<id>.pdf` | Funciona se o PDF já existir |
| F26 | Envio de credenciais e de resultado da aprovação por e-mail | Sistema | — | `email.service.ts` | Funcional (depende do Gmail) |

**Telas "mortas" ou vazias (código legado):** `Prof/page.tsx` (rota `/prof`, só um título), `Prof/VerAvisos.tsx` (`/prof/avisos/visualizar`, só botões) e `AdminEscolar/VerAvisosAdminEscolar.tsx` (só título). Nenhuma é acessada pelo menu.

---

## 4. Matriz dos 14 requisitos funcionais

> Situação de execução de **todos** os itens: **NÃO VALIDADO em tempo de execução** (ver "Como ler"). A coluna *Situação* reflete a análise do código ponta a ponta.

| RF | Situação | Interface | Backend | Persistência | Permissão no backend | Lacunas / alterações necessárias | Prioridade |
|---|---|---|---|---|---|---|---|
| **RF01** Admin escolar solicita cadastro da instituição | **IMPLEMENTADO** | `/telacadastro` — `Home/TelaCadastro.tsx:64-99` (valida CNPJ, CPF e telefone) | `solicitacao-cadastro.controller.ts:11`, `service.ts:17-30` (status `PENDENTE`) | `solicitacoesCadastro` | Pública (coerente: o solicitante ainda não tem conta) | Sem checagem de CNPJ/e-mail já solicitado; o solicitante não consegue acompanhar o status pelo sistema (só recebe e-mail) | MÉDIA |
| **RF02** Login com credenciais | **IMPLEMENTADO** | `/login` — `Login/page.tsx:18-44` | `auth.service.ts:11-36` | `usuarios` | — | Senha em texto puro; "Sair" não apaga o token; mensagem genérica de erro (correta). O login funciona, mas a segurança fica para RNF01/RNF03 | CRÍTICA (por RNF03) |
| **RF03** Admin do sistema consulta, analisa, aprova ou rejeita solicitações (cadastro, edição, remoção) | **IMPLEMENTADO** | `/admin-sistema/solicitacoes` — `Solicitacoes.tsx:87-128`, abas nas linhas 137-154 | `solicitacao-*.service.ts` `updateStatus` | `solicitacoes*`, `escolas`, `administradoresEscolares`, `usuarios` | **Nenhuma** | Aprovar/rejeitar **sem confirmação** (RNF07); erros só no `console`; sem filtro por status; o status pode ser alterado de novo depois de decidido (não há checagem de `PENDENTE`); se o e-mail falhar, a escola é criada mas o usuário do admin não (seção 11, T8) | ALTA |
| **RF04** Admin do sistema cadastra, edita e remove instituições | **PARCIAL** | Só listagem: `Escolas.tsx:16-72` | `escolas.controller.ts`: só `GET` e `DELETE` (sem cascata, sem uso na interface) | `escolas` | Nenhuma | **Não há cadastro nem edição direta.** A remoção só acontece aprovando uma solicitação. É preciso criar POST/PUT, ligar o DELETE à interface e reaproveitar a lógica de cascata | ALTA |
| **RF05** Admin escolar solicita edição ou remoção da instituição | **IMPLEMENTADO** | `/admin-escolar/escola` — `Escola.tsx:99-155` (abas Edição/Remoção) | `solicitacao-edicao` / `solicitacao-remocao` `create` | `solicitacoesEdicao`, `solicitacoesRemocao` | Nenhuma | Sem acompanhamento do status da solicitação; sem confirmação antes de enviar o pedido de remoção; a edição aceita qualquer nome de campo pela API (`solicitacao-edicao.service.ts:55-60`) | MÉDIA |
| **RF06** Admin escolar cadastra, edita e remove professores | **PARCIAL** | `/admin-escolar/professores` — cadastro `Professores.tsx:131-170`, exclusão com confirmação `:109-129` | `professores.controller.ts` (`PUT` existe em `:23`) | `professores`, `usuarios`, `escolas.professores` | Nenhuma | **Falta interface de edição**; o `PUT` do backend sobrescreve o registro inteiro e não atualiza `usuarios` (e-mail de login); sem checagem de CPF/e-mail duplicado | ALTA |
| **RF07** Admin escolar cadastra, edita e remove turmas e vínculos | **PARCIAL** | `/admin-escolar/turmas` — cadastro `Turmas.tsx:187-212`; detalhes e remoções `TurmaDetalhes.tsx:63-134` | `turmas.controller.ts` (`PUT` em `:23`, `PATCH remover-*`) | `turmas`, `escolas.turmas` | Nenhuma | **Não é possível editar dados nem incluir alunos/disciplinas depois de criada**; capacidade sem validação (comentários `Turmas.tsx:192,269,348`); a exclusão depende de `location.state` (`TurmaDetalhes.tsx:18`) | ALTA |
| **RF08** Admin escolar cadastra, edita e remove disciplinas com vínculo a professor | **PARCIAL** | `/admin-escolar/disciplinas` — `Disciplinas.tsx:148-203` (professor via select) | `disciplinas.controller.ts` (`PUT` em `:23`) | `disciplinas`, `escolas.disciplinas` | Nenhuma | **Falta edição** (incluindo troca de professor); código não validado como único | ALTA |
| **RF09** Admin escolar cadastra, edita e remove alunos com dados do responsável | **PARCIAL** | `/admin-escolar/alunos` — `Alunos.tsx:131-171` (nome, CPF, nascimento, responsável, e-mail, telefone) | `alunos.service.ts:20-76` cria o aluno e o usuário responsável e envia o e-mail | `alunos`, `usuarios`, `escolas.alunos` | Nenhuma | **Falta edição**; responsável com dois filhos gera dois usuários com o mesmo e-mail; a senha também é gravada dentro do registro do aluno (`alunos.service.ts:39`) | ALTA |
| **RF10** Professores e admins escolares enviam avisos aos destinatários | **IMPLEMENTADO** | Admin: `AvisosAdminEscolar.tsx:140-176`; Professor: `Prof/Avisos.tsx:124-185` | Admin usa `POST /avisos`; **professor grava direto no json-server** (`Prof/Avisos.tsx:152`) | `avisos`, `escolas.avisos` | Nenhuma | Destinatários = turmas (responsáveis dos alunos). Ajustar: o professor deve passar pela API; validar no backend que as turmas pertencem ao remetente | MÉDIA |
| **RF11** Professor registra e atualiza notas nas turmas/disciplinas vinculadas | **IMPLEMENTADO** | `/prof/notas` — filtros `Notas.tsx:285-320`, tabela `:329-396`, salvar `:239-268` | `notas.service.ts:18-79` (cria ou atualiza) | `notas` | **Nenhuma**: qualquer pessoa pode lançar nota em qualquer turma pela API | Filtragem por vínculo só no frontend (`Notas.tsx:76-91,151`); faixa 0–25 validada só na interface (`:209-213`), sem mensagem; sem confirmação antes de sobrescrever (RNF07) | ALTA |
| **RF12** Professor registra frequência nas turmas vinculadas | **IMPLEMENTADO** | `/prof/frequencia` — turma, disciplina e data `Frequencia.tsx:227-273`, checkbox `:305-311` | `frequencia.service.ts:20-40` (cria ou atualiza por turma+disciplina+data) | `frequencia` | Nenhuma | Sem "marcar todos"; coluna "Matrícula" mostra o CPF; vínculo verificado só no frontend | MÉDIA |
| **RF13** Responsável confirma leitura dos avisos | **IMPLEMENTADO** | `/responsavel/avisos` — `AvisosAlunos.tsx:35-55`, botão `:112-118`, filtros `:70-89` | `PUT /avisos/:id` (`avisos.service.ts:106-113`) | `avisos.responsaveisQueLeram[]` | Nenhuma | O frontend envia o aviso **inteiro** no PUT, e o backend aceita qualquer alteração (um responsável poderia mudar título/texto via API); risco de sobrescrita concorrente; o contador do admin compara leituras de responsáveis com número de alunos (`AvisosAdminEscolar.tsx:322-331`) | MÉDIA |
| **RF14** Admin escolar gera e disponibiliza relatório final para download pelos responsáveis | **PARCIAL** | Admin: `RelatorioFinalAdminEscolar.tsx:11-24`; Responsável: `RelatorioFinalAlunos.tsx:42-46` | `backend/server.js:19-190` (Express separado) | Arquivos em `backend/public/relatorios/` | **Nenhuma**: PDFs servidos como pasta pública (`server.js:17`) | Gera para **todos os alunos de todas as escolas**; não existe o estado "disponibilizado"; o responsável pode clicar antes da geração e cair num 404 sem explicação; só o primeiro filho é considerado; erros engolidos (`server.js:122`) | ALTA |

**Totais:** IMPLEMENTADO **8** · PARCIAL **6** · AUSENTE **0** · NÃO VALIDADO (por código) **0**. Nenhum dos 14 foi validado em execução.

---

## 5. Matriz dos 8 requisitos não funcionais

| RNF | Situação | Evidências | Como foi verificado | Problemas | Melhorias necessárias |
|---|---|---|---|---|---|
| **RNF01** Segurança: autenticação por login e senha | **PARCIALMENTE ATENDIDO** | Login JWT (`auth.service.ts:11-36`); rotas da interface protegidas (`ProtectedRoute.tsx:18-24`) | Leitura dos controllers e das rotas | A API (3000), o json-server (3001) e o servidor de PDFs (3002) respondem **sem login**; o token não é enviado nas requisições; logout falso | Guard JWT global no NestJS; frontend usando apenas a API, com interceptor que envia `Authorization`; json-server acessível só pelo backend; logout chamando `logout()` |
| **RNF02** Segurança: restrição por perfil | **NÃO ATENDIDO** | Nenhum `@UseGuards` fora de `/auth/me` (busca por `UseGuards` retorna só `auth.controller.ts:20`) | Busca no código + leitura de todos os controllers | Qualquer perfil (ou visitante) pode aprovar solicitações, lançar notas, apagar alunos de outra escola etc. A interface só esconde menus | `RolesGuard` + decorator `@Roles`; checagem de "dono" (escola do admin, disciplinas do professor, filho do responsável) |
| **RNF03** Segurança: armazenamento seguro | **NÃO ATENDIDO** | Senha em texto puro em `usuarios` e copiada em `alunos`/`professores`/`administradoresEscolares` (`alunos.service.ts:39`, `professores.service.ts:39`, `administrador-escolar.service.ts:33`); comparação direta (`auth.service.ts:18`); segredo JWT e credencial do Gmail no código (`auth.module.ts:13`, `email.service.ts:11-12`); o navegador baixa coleções com senhas (`AdminSistema/page.tsx:21`, `TurmaDetalhes.tsx:35-37`); PDFs com dados de alunos versionados em `backend/public/relatorios/` | Leitura do código e do `db.json` | Vazamento de credenciais de todos os usuários; credencial de e-mail exposta no repositório | `bcrypt` (já instalado) para hash; remover a senha das coleções de perfil e das respostas; `.env` + `ConfigModule` (já importado em `app.module.ts:22`); **revogar a senha de app do Gmail exposta**; tirar os PDFs do git |
| **RNF04** Desempenho: até 5 s nas operações comuns | **NÃO VALIDADO** | Sem medições | Não executável sem instalar dependências | Riscos: o login baixa todos os usuários (`auth.service.ts:14`); listagens baixam coleções inteiras e filtram no cliente; remoção em cascata faz dezenas de requisições em série; relatório gera PDFs de todos os alunos numa única requisição; polling a cada 5 s em 3 telas | Medir com o DevTools (aba Network) nos cenários da seção 9; filtrar no servidor; gerar relatórios por escola |
| **RNF05** Desempenho: relatório final ≤ 5 MB | **ATENDIDO** (com ressalva) | Os 8 PDFs existentes têm entre 1,9 KB e 2,5 KB (`backend/public/relatorios/*.pdf`); layout de 1 página, só texto e retângulos (`server.js:130-183`) | Tamanho dos arquivos + leitura do gerador | Não há verificação de tamanho no código; com muitas disciplinas o conteúdo passa do rodapé fixo (não é paginado) | Checar `fs.stat` depois de gerar; paginação simples |
| **RNF06** Usabilidade: interface simples e organizada por perfil | **PARCIALMENTE ATENDIDO** | Menu lateral por perfil com ícone + texto (`Sidebar*.tsx`); abas "Cadastrar / Visualizar" padronizadas; dashboards com contadores | Leitura dos componentes e CSS | Sem layout para celular (menu fixo de 280 px, `styles/sidebar.css:1-13`); larguras fixas (ex.: `avisosAdminEscolar.css:11` `width: 900px`); falta edição; cálculos de nota inconsistentes | Seção 13, Fase 3 |
| **RNF07** Usabilidade: confirmação antes de editar e excluir | **PARCIALMENTE ATENDIDO** | `window.confirm` em 6 exclusões: `Professores.tsx:110`, `Alunos.tsx:110`, `Disciplinas.tsx:149`, `TurmaDetalhes.tsx:64,87,112` | Busca por `confirm(` | **Sem confirmação em:** aprovar/rejeitar solicitações (inclusive a remoção em cascata de uma escola!), salvar notas (sobrescreve), salvar frequência, enviar pedido de remoção da escola, gerar relatórios. Edições não existem na interface | Modal de confirmação reutilizável (com resumo do que muda) em todas as ações de edição, exclusão e aprovação |
| **RNF08** Portabilidade: web, vários navegadores e SOs | **PARCIALMENTE ATENDIDO** | SPA React/Vite com HTML/CSS padrão; nenhuma API exclusiva de um navegador | Leitura do código | URLs `http://localhost:300x` fixas em ~108 lugares: só funciona na máquina que roda os servidores; `index.html` malformado (falta `</head><body>`) e `lang="en"`; sem testes em navegadores (**NÃO VALIDADO**) | Variável `VITE_API_URL` + uso de `api.ts`; corrigir `index.html`; roteiro de testes em Chrome, Firefox, Edge e celular |

**Totais:** ATENDIDO **1** (RNF05) · PARCIAL **4** (RNF01, RNF06, RNF07, RNF08) · NÃO ATENDIDO **2** (RNF02, RNF03) · NÃO VALIDADO **1** (RNF04).

---

## 6. Matriz de permissões por perfil

### 6.1 Esperado (documento) × aplicado (sistema)

| Perfil | RFs esperados | Na interface (`ProtectedRoute`) | No backend |
|---|---|---|---|
| Administrador Escolar | RF01, RF02, RF05, RF06, RF07, RF08, RF09, RF10, RF14 | Rotas `/admin-escolar/*` só para `admin_escolar` (`AppRoutes.tsx:39,53-62`) | **Nenhuma restrição** |
| Administrador do Sistema | RF02, RF03, RF04 | Rotas `/admin-sistema/*` só para `admin_sistema` (`AppRoutes.tsx:38,51-52`) | **Nenhuma restrição** |
| Professor | RF02, RF10, RF11, RF12 | Rotas `/prof/*` só para `prof` (`AppRoutes.tsx:41-46`) | **Nenhuma restrição** |
| Responsável | RF02, RF13, RF14 | Rotas `/responsavel/*` só para `responsavel` (`AppRoutes.tsx:40,47-50`) | **Nenhuma restrição** |

> Observação: RF01 é público no sistema (a pessoa ainda não tem conta quando solicita). Isso é coerente com o fluxo e deveria ser registrado assim no documento de requisitos.

### 6.2 Acessos indevidos identificados (reais, a partir do código)

| # | Quem | O que consegue fazer | Evidência |
|---|---|---|---|
| A1 | Qualquer pessoa com acesso à rede, sem login | Ler **todas as senhas** em `GET :3001/usuarios`, e também em `/alunos`, `/professores` e `/administradoresEscolares` | json-server sem proteção (`package.json:21`); senhas copiadas (`alunos.service.ts:39`) |
| A2 | Qualquer usuário logado (ou visitante) | Aprovar ou rejeitar solicitações, inclusive aprovar a **remoção em cascata** de uma escola | `solicitacao-remocao.controller.ts:26-28` sem guard |
| A3 | Responsável | O navegador já baixa **todos os alunos** (com CPF, telefone e senha) para achar o próprio filho | `Responsavel/page.tsx:31`, `NotasAlunos.tsx:42`, `FrequenciaAlunos.tsx:38`, `RelatorioFinalAlunos.tsx:23` |
| A4 | Responsável (ou qualquer pessoa) | Baixar o relatório de **qualquer aluno** trocando o ID na URL | `server.js:17`; `RelatorioFinalAlunos.tsx:44` |
| A5 | Responsável | Alterar o conteúdo de um aviso via `PUT /avisos/:id` | `avisos.controller.ts:29-32` aceita qualquer corpo |
| A6 | Professor | Lançar notas/frequência em turmas e disciplinas que não são suas | `notas.controller.ts:13`, `frequencia.controller.ts:18` sem checagem de vínculo |
| A7 | Admin escolar da escola A | Apagar professores, alunos, turmas e disciplinas da escola B (basta o ID) | `DELETE /professores/:id` etc. sem checar a escola |
| A8 | Admin escolar | Gerar relatórios de **todas as escolas** | `server.js:21-23` lê todos os alunos |
| A9 | Qualquer pessoa | Fingir ser outro usuário trocando `usuario_email` no `localStorage` (as telas confiam nesse valor) | ex.: `AdminEscolar.tsx:21`, `Notas.tsx:56` |
| A10 | Qualquer pessoa | Alterar qualquer campo da escola aprovando uma "edição" com nome de campo arbitrário via API | `solicitacao-edicao.service.ts:55-60` |

### 6.3 Permissões que faltam (o perfil deveria poder e não pode)

- **Admin do Sistema:** cadastrar e editar escola diretamente (RF04).
- **Admin Escolar:** editar professores, alunos, turmas e disciplinas (RF06–RF09); acompanhar o status das suas solicitações (apoio ao RF05).

---

## 7. Avaliação das quatro personas

> **Pré-condição comum para qualquer demonstração:** os 4 processos no ar e uma escola aprovada. Hoje o banco só tem 4 usuários de semente **sem perfil vinculado**, então Michele, Lorenza e Breno só conseguem usar o sistema depois que Alfredo aprova uma solicitação e Michele cadastra professores e alunos. Esses usuários **recebem a senha apenas por e-mail** (Gmail). Se o envio falhar, a conta não é criada por completo (T8, seção 11).

### 7.1 Breno — Responsável

| # | Cenário | Classificação | Caminho na interface | Arquivos | Observações |
|---|---|---|---|---|---|
| 1 | Login | FUNCIONAL | `/login` | `Login/page.tsx`, `auth.service.ts` | Senha chega por e-mail no cadastro do aluno |
| 2 | Localizar o aluno vinculado | PARCIAL | Automático em `/responsavel` | `Responsavel/page.tsx:31-58` | Usa o **primeiro** aluno com o e-mail do responsável (`.find`); com dois filhos, o segundo nunca aparece |
| 3 | Consultar notas | PARCIAL | Menu "Notas" → `/responsavel/notas` | `NotasAlunos.tsx:37-117` | A coluna "Nota Final" calcula **média**, mas a legenda diz "soma" (`:93-95` × `:169`); o professor vê soma |
| 4 | Consultar frequência | FUNCIONAL | Menu "Frequência" | `FrequenciaAlunos.tsx` | Legenda de cores clara. Sem chamadas registradas mostra **100%** (`:110`), o que engana |
| 5 | Ver avisos recebidos | FUNCIONAL | Menu "Avisos" ou "Ver avisos" no dashboard | `AvisosAlunos.tsx`, `avisos.service.ts:64-105` | Filtros Todos / Não lidos / Lidos com contador |
| 6 | Confirmar leitura | FUNCIONAL | Botão "Marcar como lido" | `AvisosAlunos.tsx:35-55,112-118` | Sem retorno visual além de o botão sumir; não dá para desfazer |
| 7 | Baixar relatório final | PARCIAL | Menu "Relatório Final" → "Baixar Relatório" | `RelatorioFinalAlunos.tsx:42-46` | Se o admin ainda não gerou, abre uma aba com erro 404; não há indicação de "disponível" |

**Ponta a ponta?** Quase. Consultas e avisos funcionam; o relatório depende de o admin ter gerado antes, e a nota tem cálculo inconsistente.

### 7.2 Lorenza — Professora

| # | Cenário | Classificação | Caminho | Arquivos | Observações |
|---|---|---|---|---|---|
| 1 | Login | FUNCIONAL | `/login` → `/prof/dashboard` | `Login/page.tsx:38` | |
| 2 | Consultar turmas e disciplinas vinculadas | PARCIAL | Dashboard (só contadores); listas aparecem dentro de Notas e Frequência | `Prof/Dashboard.tsx:40-85` | Não há tela "Minhas turmas" com nomes, horários e alunos |
| 3 | Localizar um aluno | PARCIAL | Notas/Frequência → escolher turma e disciplina → tabela | `Notas.tsx:343-389` | Sem busca por nome; o aluno é identificado por nome + CPF |
| 4 | Registrar notas | FUNCIONAL | Menu "Notas" → Turma → Disciplina → digitar → "Salvar Notas" | `Notas.tsx:239-268`, `notas.service.ts:18-79` | Valor fora de 0–25 é **ignorado em silêncio** (`:212`) |
| 5 | Atualizar notas | FUNCIONAL | Mesmo caminho (os valores salvos voltam preenchidos) | `Notas.tsx:174-192`, `notas.service.ts:60-62` | Sobrescreve sem confirmar |
| 6 | Registrar frequência | FUNCIONAL | Menu "Frequência" → Turma → Disciplina → Data → marcar → "Salvar Frequência" | `Frequencia.tsx:183-210`, `frequencia.service.ts:20-40` | Data padrão = hoje; sem "marcar todos" |
| 7 | Publicar avisos | FUNCIONAL | Menu "Avisos" → "Enviar" | `Prof/Avisos.tsx:124-185` | Grava direto no json-server (fora da API) |
| 8 | Verificar se salvou | FUNCIONAL | Modal "Notas salvas com sucesso!" e recarga dos dados | `Notas.tsx:262-263`, `Frequencia.tsx:204-205` | O modal some em 3 s; o botão não fica desabilitado durante o envio |

**Ponta a ponta?** **Sim**, para as tarefas principais (notas, frequência, avisos).

### 7.3 Michele — Administradora Escolar

| # | Cenário | Classificação | Caminho | Arquivos | Observações |
|---|---|---|---|---|---|
| 1 | Login | FUNCIONAL | `/login` → `/admin-escolar/dashboard` | `Login/page.tsx:37` | Conta criada na aprovação do RF03 |
| 2 | Consultar informações da instituição | FUNCIONAL | Menu "Escola" (aba Edição mostra a tabela) | `Escola.tsx:198-227` | |
| 3 | Solicitar edição/remoção | FUNCIONAL | Menu "Escola" → abas Edição/Remoção → "Enviar" | `Escola.tsx:99-155` | Sem histórico/status do pedido; remoção sem confirmação |
| 4 | Cadastrar e gerenciar professores | PARCIAL | Menu "Professores" → Cadastrar / Visualizar → Deletar | `Professores.tsx` | **Sem edição**; destaque de erro em CPF/data não aparece (T15) |
| 5 | Cadastrar e gerenciar alunos e responsáveis | PARCIAL | Menu "Alunos" | `Alunos.tsx` | **Sem edição**; sem CPF duplicado |
| 6 | Cadastrar e gerenciar turmas | PARCIAL | Menu "Turmas" → Visualizar → "Ver Mais" | `Turmas.tsx`, `TurmaDetalhes.tsx` | **Sem edição e sem incluir alunos depois de criada**; a tela de detalhes pode quebrar se um aluno da turma tiver sido apagado (T12) |
| 7 | Cadastrar e gerenciar disciplinas | PARCIAL | Menu "Disciplinas" | `Disciplinas.tsx` | **Sem edição** |
| 8 | Publicar avisos | FUNCIONAL | Menu "Avisos" → Enviar / Visualizar (com "x/y lidos") | `AvisosAdminEscolar.tsx` | |
| 9 | Gerar e disponibilizar relatórios | PARCIAL | Menu "Relatório Final" → "Gerar Relatórios e Publicar" | `RelatorioFinalAdminEscolar.tsx`, `server.js` | Gera para todas as escolas; não escolhe turma ou aluno; sem pré-visualização |

**Ponta a ponta?** **Não completamente**: cadastra e exclui, mas não edita (RF06–RF09 parciais).

### 7.4 Alfredo — Administrador do Sistema

| # | Cenário | Classificação | Caminho | Arquivos | Observações |
|---|---|---|---|---|---|
| 1 | Login | FUNCIONAL | `/login` → `/admin-sistema` (conta de semente `adminsistema@cresce.com`) | `db.json` | |
| 2 | Consultar instituições | FUNCIONAL | Menu "Escolas" | `Escolas.tsx` | Sem busca/filtro |
| 3 | Consultar solicitações pendentes | FUNCIONAL | Dashboard (contador "Solicitações Pendentes") → Menu "Solicitações" | `AdminSistema/page.tsx:27-35`, `Solicitacoes.tsx` | Sem filtro por status: pendentes e decididas aparecem misturadas |
| 4 | Analisar uma solicitação de cadastro | FUNCIONAL | Aba "Cadastro" → card com dados da instituição e do representante | `Solicitacoes.tsx:161-215` | Boa organização em duas colunas |
| 5 | Aprovar | FUNCIONAL (depende do SMTP) | Botão "Aprovar Cadastro" | `solicitacao-cadastro.service.ts:61-98` | **Sem confirmação**; sem retorno visual de sucesso; se o e-mail falhar, a conta do admin escolar não é criada |
| 6 | Rejeitar | FUNCIONAL | Botão "Rejeitar Cadastro" | `solicitacao-cadastro.service.ts:101-107` | Sem confirmação; não pede motivo (o e-mail traz motivos genéricos) |
| 7a | Cadastrar escola diretamente | INEXISTENTE | — | — | RF04 |
| 7b | Editar escola diretamente | INEXISTENTE | — | — | RF04 (só via solicitação) |
| 7c | Remover escola diretamente | PARCIAL | Só aprovando uma solicitação de remoção | `escolas.controller.ts:13` existe, mas sem interface e sem cascata | RF04 |

**Ponta a ponta?** **Sim para RF03; não para RF04.**

---

## 8. Avaliação das 10 heurísticas de Nielsen

> Para cada heurística: ✅ exemplo positivo existente · ⚠️ exemplo negativo / oportunidade · 📍 tela · 📄 arquivo · 💡 recomendação.

### H1 — Visibilidade do status do sistema
- ✅ Botões mudam de texto e ficam desabilitados durante o envio: "Salvando..." (📄 `Alunos.tsx:285-286`, `Professores.tsx:284-285`), "Solicitando..." (`TelaCadastro.tsx:188-189`), "Gerando Documentos..." (`RelatorioFinalAdminEscolar.tsx:37-38`). Modal de sucesso após salvar notas (`Notas.tsx:262`) e frequência (`Frequencia.tsx:204`). Selos de status `PENDENTE/APROVADA/REJEITADA` (`Solicitacoes.tsx:168-170`). Contador de não lidos (`AvisosAlunos.tsx:81`). Item de menu ativo destacado (`styles/sidebar.css` `.active`).
- ⚠️ 📍 Solicitações: aprovar/rejeitar não mostra nenhuma mensagem, e o erro vai só para o `console` (`Solicitacoes.tsx:94-95`). 📍 Notas/Frequência: o botão "Salvar" não indica envio e não é desabilitado (`Notas.tsx:394`), o que permite duplo clique. 📍 Detalhes da turma e listagens: sem "carregando". O modal some sozinho em 3 s (8 cópias de `acionarModal`).
- 💡 Componente único de *toast*/modal com estado "carregando / sucesso / erro" e `aria-live`; desabilitar botões durante requisições; feedback em aprovar/rejeitar.

### H2 — Correspondência entre o sistema e o mundo real
- ✅ Vocabulário escolar: turmas, disciplinas, 1º–4º bimestre, "Presente?", "Boletim", "Marcar como lido", legenda "90% ou mais — Excelente" (`FrequenciaAlunos.tsx:198-214`); tipos de aviso "Informativo/Alerta" com descrição (`AvisosAdminEscolar.tsx:244-272`).
- ⚠️ 📍 Frequência do professor: a coluna "**Matrícula**" mostra o **CPF** (`Frequencia.tsx:288,303`). 📍 Solicitações: status em caixa alta técnica (`APROVADA`) e setor com o valor interno ("infantil"). 📍 Frequência do responsável: subtítulo fixo "Ensino Fundamental I" para qualquer turma (`FrequenciaAlunos.tsx:174`), e o dashboard converte o ano "1" em "Educação Básica" (`Responsavel/page.tsx:48-53`). 📍 Aba "Remover" no admin do sistema (`Solicitacoes.tsx:153`).
- 💡 Mostrar "CPF" ou criar um número de matrícula; traduzir status ("Pendente", "Aprovada"); derivar o segmento do `setorEducacional` da escola.

### H3 — Controle e liberdade do usuário
- ✅ "Voltar ao Início" no login (`Login/page.tsx:49-52`); "← Voltar" nos detalhes da turma (`TurmaDetalhes.tsx:147-150`); exclusões podem ser canceladas no `confirm`; abas permitem trocar de modo sem perder a navegação.
- ⚠️ 📍 Avisos (admin): botão **Cancelar comentado** (`AvisosAdminEscolar.tsx:304-308`). 📍 Cadastros: sem edição, então corrigir um erro de digitação obriga a **excluir e cadastrar de novo** (o que gera outro e-mail de senha). 📍 "Marcar como lido" não pode ser desfeito. 📍 "Sair" não encerra a sessão (`SidebarAdminEscolar.tsx:49`).
- 💡 Botão "Cancelar / Limpar" nos formulários; modo edição; logout real; opção "marcar como não lido".

### H4 — Consistência e padrões
- ✅ Mesmo padrão de menu lateral nos 4 perfis (`styles/sidebar.css`); mesmo par de abas "Cadastrar / Visualizar" em Professores, Alunos, Turmas e Disciplinas; mesmo modal de sucesso/erro.
- ⚠️ 📍 **Nota final com três regras diferentes:** soma no professor (`Notas.tsx:224-236`), média no boletim do responsável com legenda "soma" (`NotasAlunos.tsx:93-95,169`), média em escala 0–10 no dashboard (`Responsavel/page.tsx:122-123`), soma por disciplina e média das somas no PDF (`server.js:94,125-128`). 📍 Rótulos "Deletar" × "Remover" × "Excluir". 📍 Data de nascimento como texto livre (`Alunos.tsx:236-244`) × `type="date"` na frequência. 📍 Campo de e-mail do login com placeholder "Usuário" (`Login/page.tsx:70`). 📍 Margens diferentes por tela (280 px × 320 px).
- 💡 Definir a regra de cálculo (no documento de requisitos!) e aplicá-la em um só lugar; padronizar rótulos e componentes de formulário.

### H5 — Prevenção de erros
- ✅ Confirmação antes de excluir (6 ações, ver RNF07). Bloqueio no backend de exclusões que deixariam dados órfãos, com mensagem: "Aluno pertence a uma turma." (`alunos.service.ts:100-104`), "Disciplina está sendo dada em turma(s)." (`disciplinas.service.ts:71-75`), "Professor está dando disciplina(s)." (`professores.service.ts:99-103`). Campo de nota recusa valores fora de 0–25 (`Notas.tsx:209-213`). Validadores de CPF, CNPJ, telefone e data (`utils/validadores.ts`). Listas de seleção no lugar de digitação (setor, ano/série, turno, professor).
- ⚠️ 📍 **Não existe verificação de CPF, CNPJ ou e-mail duplicado** em nenhum lugar (busca por "já cadastrado"/"duplicado" sem resultados). 📍 Capacidade da turma sem validação: o próprio código tem "fazer verificacao pra capacidade" (`Turmas.tsx:192,269,348`). 📍 Aprovar a remoção de uma escola apaga tudo **sem confirmar**. 📍 O backend não valida nenhum dado (sem `ValidationPipe`).
- 💡 CPF e e-mail únicos no backend com mensagem clara; validar capacidade; confirmação reforçada em ações destrutivas; DTOs com `class-validator` (já instalado).

### H6 — Reconhecimento em vez de memorização
- ✅ Menu com ícone **e** texto (`Sidebar*.tsx`); seleção por nome em listas (react-select) em vez de IDs (`Turmas.tsx:293-347`); o professor só vê as **suas** turmas e disciplinas nos filtros (`Notas.tsx:76-91`); valores já salvos voltam preenchidos.
- ⚠️ 📍 Solicitação de edição da escola: escolhe-se o campo e digita-se o valor novo, mas o valor **atual** não aparece ao lado do campo (só na tabela acima) (`Escola.tsx:230-258`). 📍 A lista de turmas mostra "1º" sem o nível de ensino.
- 💡 Ao escolher o campo, preencher o valor atual; mostrar o contexto completo da turma.

### H7 — Eficiência e flexibilidade de uso
- ✅ Filtros por **turma, disciplina e data** em Notas e Frequência (`Frequencia.tsx:227-273`); lançamento em lote (a turma toda numa tabela); filtros "Todos / Não lidos / Lidos" (`AvisosAlunos.tsx:70-89`); data padrão = hoje (`Frequencia.tsx:34-35`).
- ⚠️ 📍 Sem busca nas tabelas (escolas, professores, alunos); sem filtro por status nas solicitações; sem "marcar todos como presentes"; sem filtro por **período** (citado no documento de heurísticas); sem atalhos.
- 💡 Campo de busca nas tabelas; filtro de status; "marcar todos"; filtro por bimestre/período.

### H8 — Estética e design minimalista
- ✅ Paleta azul consistente (menu `#001CA9`, destaque `#778EFF`); cards de métricas limpos nos dashboards; cores com significado (verde/amarelo/vermelho) na frequência e nos avisos.
- ⚠️ 📍 Tela `/prof` vazia, duplicando o dashboard (`Prof/page.tsx`). 📍 Página inicial com texto narrativo longo (`TelaInicial.tsx:29-34`). 📍 Emojis (🔔, ⓘ) misturados com react-icons (`AvisosAdminEscolar.tsx:253,266`). 📍 Larguras fixas que estouram em telas menores.
- 💡 Remover telas mortas; usar uma só família de ícones; layout fluido.

### H9 — Ajudar a reconhecer, diagnosticar e corrigir erros
- ✅ Mensagens do backend exibidas ao usuário em conflitos de exclusão (`Alunos.tsx:124-127`). Boletim com mensagens específicas: "O aluno X foi encontrado, mas não está matriculado em nenhuma turma." (`NotasAlunos.tsx:62`). Campos inválidos destacados em vermelho (`campo-invalido`, `TelaCadastro.tsx:123`). Login: "Email ou senha inválidos".
- ⚠️ 📍 Mensagens genéricas sem causa nem solução: "Erro ao cadastrar professor." (`Professores.tsx:166`). 📍 Campo inválido sem texto explicativo ("CPF deve ter 11 dígitos"). 📍 **Destaque que nunca aparece:** a validação registra `"cpfProfessor"` e `"dataNascimentoProfessor"`, mas os campos procuram `"cpf"` e `"dataNascimentoP"` (`Professores.tsx:137,145` × `:227,242`); o mesmo ocorre em Disciplinas (`"cargaHorariaSemanal"` × `"cargaHoraria"`, `:176` × `:260`). O formulário não envia e não diz por quê. 📍 Nota fora do intervalo é ignorada em silêncio. 📍 **O exemplo do documento ("CPF já cadastrado") não existe no sistema.**
- 💡 Texto de erro abaixo de cada campo; corrigir as chaves; implementar e exibir "Este CPF já está cadastrado"; mensagem para nota fora de 0–25.

### H10 — Ajuda e documentação
- ✅ Descrição dos tipos de aviso ("Mensagem geral para informar algo."); legenda de frequência; rodapé "* Nota final: soma das notas dos bimestres" (`NotasAlunos.tsx:169`); placeholders com exemplo ("Ex: 9º Ano A", "000.000.000-00", "Ex: MAT101").
- ⚠️ Não há página de ajuda, FAQ, *tooltips* nem orientação de primeiro acesso; a legenda da nota contradiz o cálculo; a escala de notas (0–25 por bimestre) não é explicada em lugar nenhum.
- 💡 Página "Como usar" por perfil, com passos das tarefas principais; dicas curtas (ícone "?") nos formulários complexos (turmas, notas).

---

## 9. Proposta de avaliação de usabilidade por persona

> **Atenção:** os itens abaixo são **cenários propostos** no formato PERSONA → TAREFA → AVALIAÇÃO. **Nenhum teste com usuários foi realizado** e nenhum resultado é apresentado. Sugere-se registrar para cada execução: concluiu (sim/não/com ajuda), tempo, número de erros e comentários (método *think-aloud*), além de uma escala de satisfação (ex.: SUS) no final.

| ID | Persona | Objetivo | Pré-condições | Passos | Resultado esperado | Critérios de sucesso | Problemas a observar | Heurísticas |
|---|---|---|---|---|---|---|---|---|
| **AV-B1** | Breno | Ver a situação geral do filho | Conta de responsável; aluno em turma com notas e chamadas | 1. Login 2. Ler o dashboard | Identifica nome, turma, média, frequência e avisos não lidos | Concluir sem ajuda em ≤ 1 min; interpretar a média corretamente | Escala da média (0–10 × notas 0–25); frequência 100% sem registros | H1, H2, H4 |
| **AV-B2** | Breno | Consultar notas de uma disciplina e entender a nota final | Notas lançadas em ≥ 2 bimestres | 1. Menu Notas 2. Localizar a disciplina 3. Explicar como a nota final foi calculada | Encontra a nota e entende o cálculo | Explicação correta do cálculo | Legenda "soma" × cálculo de média | H2, H4, H10 |
| **AV-B3** | Breno | Ler e confirmar um aviso não lido | ≥ 1 aviso para a turma | 1. Dashboard → "Ver avisos" 2. Filtrar "Não lidos" 3. Marcar como lido | O aviso passa para "Lidos" | Concluir em ≤ 1 min; perceber a mudança | Falta de retorno visual; não há como desfazer | H1, H3, H7 |
| **AV-B4** | Breno | Baixar o relatório final | (a) relatório gerado; (b) **não** gerado | 1. Menu Relatório Final 2. Baixar | (a) PDF abre; (b) mensagem explicando que ainda não está disponível | (a) concluir; (b) entender a situação | Página 404 em (b) | H1, H9 |
| **AV-L1** | Lorenza | Lançar as notas do 1º bimestre de uma turma | Professora vinculada a uma disciplina da turma | 1. Menu Notas 2. Turma 3. Disciplina 4. Digitar 5. Salvar | Mensagem de sucesso; notas reaparecem ao recarregar | Sem erros; ≤ 3 min para 10 alunos | Valor fora do intervalo ignorado sem aviso; duplo clique em salvar | H1, H5, H9 |
| **AV-L2** | Lorenza | Corrigir a nota de um aluno | AV-L1 feita | 1. Abrir a mesma turma/disciplina 2. Localizar o aluno 3. Alterar 4. Salvar | Nota atualizada | Encontrar o aluno sem rolar a lista inteira | Ausência de busca; sem confirmação ao sobrescrever | H6, H7, H5 |
| **AV-L3** | Lorenza | Fazer a chamada de hoje | Turma com alunos | 1. Menu Frequência 2. Turma/Disciplina/Data 3. Marcar presentes 4. Salvar | Chamada salva | ≤ 2 min; entender o checkbox | "Matrícula" = CPF; sem "marcar todos" | H2, H7 |
| **AV-L4** | Lorenza | Publicar um alerta para uma turma | Professora com turma | 1. Menu Avisos 2. Selecionar turma 3. Tipo Alerta 4. Título/mensagem 5. Enviar 6. Conferir em "Visualizar" | Aviso listado com "0/n lidos" | Concluir sem ajuda | Card de tipo de aviso não acessível por teclado | H1, H6 |
| **AV-M1** | Michele | Cadastrar um professor | Escola aprovada | 1. Menu Professores 2. Preencher 3. Salvar | Mensagem de sucesso; professor na aba Visualizar | Concluir; em caso de erro, entender qual campo corrigir | Destaque de erro que não aparece (T15); erro genérico | H5, H9 |
| **AV-M2** | Michele | Corrigir o telefone de um aluno já cadastrado | Aluno cadastrado | 1. Menu Alunos 2. Visualizar 3. Tentar editar | Edição concluída (**hoje impossível**) | Encontrar a ação de editar | Ausência da função; tentativa de excluir e recadastrar | H3, H6 |
| **AV-M3** | Michele | Criar uma turma com alunos e disciplinas e conferir os detalhes | Alunos e disciplinas cadastrados | 1. Menu Turmas 2. Preencher e selecionar 3. Salvar 4. Visualizar → Ver Mais | Turma com alunos e disciplinas/professores | Concluir; perceber o limite de capacidade | Capacidade não validada; não dá para incluir alunos depois | H5, H3 |
| **AV-M4** | Michele | Gerar e disponibilizar os relatórios | Notas/frequência lançadas | 1. Menu Relatório Final 2. Gerar | Mensagem de sucesso | Entender o que foi gerado e para quem | Gera para todas as escolas; sem lista do que foi gerado | H1, H10 |
| **AV-A1** | Alfredo | Identificar e aprovar uma solicitação pendente | 1 solicitação pendente e 1 já decidida | 1. Dashboard (contador) 2. Solicitações 3. Achar a pendente 4. Aprovar | Selo muda para "APROVADA"; escola aparece em Escolas | ≤ 2 min; sem aprovação por engano | Sem filtro por status; sem confirmação; sem mensagem de sucesso | H1, H5, H7 |
| **AV-A2** | Alfredo | Rejeitar um pedido de remoção | Pedido de remoção pendente | 1. Solicitações → Remover 2. Ler a justificativa 3. Rejeitar | Selo "REJEITADA" | Concluir com segurança | Botões de aprovar e rejeitar lado a lado, sem confirmação | H5, H3 |
| **AV-A3** | Alfredo | Corrigir o telefone de uma escola diretamente | Escola cadastrada | 1. Menu Escolas 2. Tentar editar | Edição (**hoje impossível**, RF04) | Encontrar a função | Ausência da função | H3, H6 |

---

## 10. EXEMPLOS PARA APRESENTAÇÃO

> Legenda: ✅ pode ser demonstrado hoje · ⚠️ demonstrável, mas mostra também um problema (útil como "oportunidade de melhoria") · 🔧 depende de ajuste antes.
> **Preparação obrigatória:** subir os 4 serviços; ter uma escola aprovada com 1 admin escolar, 1 professor, 2 alunos/responsáveis, 1 turma e 2 disciplinas, com notas e chamadas lançadas. Como as senhas só chegam por e-mail, **use caixas de e-mail de teste da equipe** ou aplique primeiro a tarefa 1.6 da Fase 1 (semente de demonstração).

### 10.1 Atendimento aos requisitos funcionais

| Exemplo | Caminho | O que demonstrar | Captura sugerida |
|---|---|---|---|
| ✅ RF01 | `/` → "Solicitar cadastro da escola" | Formulário completo; destaque vermelho no CNPJ inválido; modal "Cadastro solicitado com sucesso!" | Formulário com CNPJ em vermelho + modal de sucesso |
| ✅ RF02 | `/login` | Login de cada perfil levando a um painel diferente | 4 telas iniciais lado a lado |
| ✅ RF03 | Admin Sistema → Solicitações | Abas Cadastro/Edição/Remover; card com dados em duas colunas; aprovar | Card pendente + mesmo card com selo "APROVADA" |
| ✅ RF05 | Admin Escolar → Escola | Abas Edição/Remoção; lista de campos editáveis | Aba Edição com tabela e formulário |
| ⚠️ RF06–RF09 | Admin Escolar → Professores/Alunos/Turmas/Disciplinas | Cadastro e listagem (abas); mostrar que falta a edição | Formulário de aluno com dados do responsável |
| ✅ RF07 vínculos | Turmas → Visualizar → "Ver Mais" | Alunos e disciplinas com professor; remover aluno com confirmação | Tela de detalhes da turma |
| ✅ RF10 | Professor → Avisos → Enviar | Seleção múltipla de turmas; cards Informativo/Alerta | Formulário de aviso preenchido |
| ✅ RF11 | Professor → Notas | Filtros encadeados; tabela de bimestres; nota final calculada | Tabela de notas preenchida + modal de sucesso |
| ✅ RF12 | Professor → Frequência | Turma/Disciplina/Data; checkboxes | Tabela de chamada |
| ✅ RF13 | Responsável → Avisos | Filtro "Não lidos" com contador → "Marcar como lido"; no admin, o selo "1/2 lidos" | Antes/depois + visão do admin |
| ⚠️ RF14 | Admin Escolar → Relatório Final → Gerar; Responsável → Relatório Final → Baixar | Botão "Gerando Documentos..." e o PDF gerado | PDF aberto |

### 10.2 Separação de permissões entre os quatro perfis

| Exemplo | Caminho | O que demonstrar |
|---|---|---|
| ✅ Menus diferentes | Fazer login com cada perfil | Cada perfil tem seu menu (capturas dos 4 menus lado a lado) |
| ✅ Bloqueio de rota na interface | Logado como professor, digitar `/admin-escolar/alunos` | É redirecionado para `/` (`ProtectedRoute.tsx:22-24`) |
| ⚠️ Limite atual (opcional, honesto) | Abrir `http://localhost:3001/usuarios` no navegador | Mostrar que a proteção é só visual. **Não exibir as senhas na tela**: usar uma base de teste ou borrar a captura. Serve para justificar a Fase 1 |

### 10.3 Heurísticas, usabilidade, erros, confirmação e navegação

| Heurística / tema | Caminho | O que demonstrar | Captura |
|---|---|---|---|
| H1 Status | Admin Escolar → Alunos → Salvar | Botão "Salvando..." desabilitado + modal verde | Botão durante o envio |
| H1 Status | Responsável → Avisos | Contador de não lidos no filtro | Filtro com o número |
| H2 Mundo real | Professor → Notas / Responsável → Frequência | Bimestres; legenda Excelente/Atenção/Crítico | Card de frequência com legenda |
| H3 Controle | Detalhes da turma → "← Voltar"; Login → "Voltar ao Início" | Saída fácil | — |
| H4 Consistência | Professores × Alunos × Turmas × Disciplinas | Mesmo par de abas e mesmo modal | Mosaico de 4 telas |
| H5 Prevenção | Professores → Visualizar → Deletar | `confirm` "Tem certeza que deseja excluir este professor?" | Caixa de confirmação |
| H5 Prevenção | Tentar excluir um aluno que está em turma | Mensagem "Aluno pertence a uma turma." | Modal vermelho |
| H5 Prevenção | Notas → digitar 30 | O campo não aceita (limite 0–25) | — (explicar oralmente) |
| H6 Reconhecimento | Turmas → Cadastrar | Seleção de alunos e disciplinas por nome | Select aberto |
| H7 Eficiência | Frequência | Filtros encadeados + data padrão hoje + lançamento em lote | Barra de filtros |
| H8 Estética | Dashboards | Cards com ícones e paleta consistente | Dashboard do admin escolar |
| H9 Erros | Boletim de aluno sem turma | "O aluno X foi encontrado, mas não está matriculado em nenhuma turma." | Mensagem |
| H9 Erros | Login com senha errada | "Email ou senha inválidos" | — |
| H10 Ajuda | Avisos → tipo de aviso | Descrição de cada tipo | Cards de tipo |
| 🔧 H9 "CPF já cadastrado" (exemplo do documento) | — | **Não existe ainda**; implementar (Fase 2.8) para poder mostrar | — |
| 🔧 RNF07 em edição | — | Depende da edição (Fase 2.1) | — |

### 10.4 Exemplos de "oportunidade de melhoria" (bons para a parte crítica da apresentação)

1. Nota final com três cálculos diferentes (H4) — boletim do responsável × tela do professor.
2. Aprovar a remoção de uma escola sem confirmação (H5/RNF07).
3. Coluna "Matrícula" mostrando CPF (H2).
4. Campo inválido em Professores que não fica vermelho (H9).
5. Menu lateral fixo quebrando a tela em celular (responsividade/RNF06): capturar com o DevTools em 375 px.

---

## 11. Problemas técnicos encontrados

| ID | Problema | Evidência | Impacto | Prioridade |
|---|---|---|---|---|
| T1 | Frontend acessa o json-server diretamente (59 chamadas), fora da API | busca por `localhost:3001` em `frontend/src` | Torna inútil qualquer controle de acesso no backend | CRÍTICA |
| T2 | Nenhum guard de autenticação/perfil nos controllers | só `auth.controller.ts:20` | RNF01/RNF02 | CRÍTICA |
| T3 | Senhas em texto puro; `bcrypt` instalado e não usado | `auth.service.ts:18`, `alunos.service.ts:39` | RNF03 | CRÍTICA |
| T4 | Segredos no repositório: chave JWT e **credencial do Gmail** | `auth.module.ts:13`, `jwt.strategy.ts:11`, `email.service.ts:11-12` | Credencial exposta no histórico do git; **revogar** | CRÍTICA |
| T5 | Senha copiada nos registros de perfil e baixada pelo navegador | `professores.service.ts:39`, `TurmaDetalhes.tsx:37`, `AdminSistema/page.tsx:21` | Vazamento | CRÍTICA |
| T6 | Vínculo escola↔entidades por CPF/código/nome/data; a remoção em cascata apaga turmas **por nome** e disciplinas **por código** em todas as escolas | `solicitacao-remocao.service.ts:135-147` | Perda de dados de outra escola | ALTA |
| T7 | IDs gerados por `max+1` por coleção e reutilizados em `usuarios`; `user.id` do JWT usado como `remetenteId` do professor | `alunos.service.ts:28-29,53`; `Prof/Avisos.tsx:16,147` | Colisão com IDs de semente "1"–"4"; ❓ comportamento do json-server com ID repetido não verificado | ALTA |
| T8 | O e-mail é enviado **antes** de criar o usuário; se falhar, o cadastro fica pela metade (perfil sem login) | `alunos.service.ts:43-59`, `professores.service.ts:43-58`, `administrador-escolar.service.ts:39-54` | Inviabiliza a demonstração sem internet/SMTP | ALTA |
| T9 | Servidor de relatórios separado, sem autenticação, gera para todos, engole erros; PDFs com dados de alunos versionados | `server.js:17,21-23,122`; `backend/public/relatorios/` | RF14/RNF03 | ALTA |
| T10 | Logout não remove o token | `Sidebar*.tsx` (`<Link to="/login">`), `AuthContext.tsx:35` | Sessão continua ativa | ALTA |
| T11 | Identidade das telas tirada de `localStorage.usuario_email` | `Login/page.tsx:32` e ~12 telas | Personificação | ALTA (resolvido com T1/T2) |
| T12 | Detalhes da turma quebram se um aluno/disciplina/professor não for encontrado | `TurmaDetalhes.tsx:200,237,240` (`aluno.nomeAluno` com `aluno` indefinido) | Tela branca | MÉDIA |
| T13 | Excluir turma depende de `location.state.escolaId`; ao recarregar a página fica vazio e `escola.turmas` não é atualizado | `TurmaDetalhes.tsx:18,71` | Contadores errados | MÉDIA |
| T14 | `setInterval` criado fora do retorno do `useEffect` (nunca é limpo) | `AvisosAdminEscolar.tsx:69-72` | Requisições acumuladas | MÉDIA |
| T15 | Chaves de erro de formulário não batem com os campos | `Professores.tsx:137,141,145` × `:227,242,268`; `Disciplinas.tsx:176` × `:260` | Erro invisível | MÉDIA |
| T16 | Regra da nota final inconsistente entre telas e PDF | ver H4 | Informação errada para o responsável | ALTA (requisito) |
| T17 | Frequência mostra 100% quando não há chamadas | `FrequenciaAlunos.tsx:110`, `server.js:49` | Informação enganosa | MÉDIA |
| T18 | "Marcar como lido" envia o aviso inteiro; o backend aceita qualquer alteração | `AvisosAlunos.tsx:41-45`, `avisos.service.ts:106-113` | Sobrescrita/edição indevida | MÉDIA |
| T19 | Aprovar edição grava um nome de campo arbitrário; o status pode ser decidido de novo | `solicitacao-edicao.service.ts:42-62` | Atribuição em massa | MÉDIA |
| T20 | Único teste e2e desatualizado; nenhum teste unitário | `test/app.e2e-spec.ts:22-24` × `app.controller.ts:7-9` | Sem rede de segurança | MÉDIA |
| T21 | URLs fixas (`localhost`); `api.ts` não é usado | ~108 ocorrências; `services/api.ts` | RNF08 | MÉDIA |
| T22 | `index.html` sem `</head><body>` e com `lang="en"` | `frontend/index.html:2-12` | Acessibilidade e leitores de tela | BAIXA |
| T23 | README desatualizado (integrantes da disciplina anterior; instala pacotes que já estão no `package.json`) | `README.md` | Documentação | BAIXA |
| T24 | Dependências de backend no frontend | `frontend/package.json` (`@nestjs/passport`, `passport`, `passport-jwt`) | Manutenção | BAIXA |
| T25 | Classes de domínio divergentes do formato gravado; `RelatorioFinal.ts` vazio; coleção `responsaveis` sem uso | `backend/src/classes/*` | Manutenção/documentação | BAIXA |
| T26 | Nenhuma validação no servidor (DTOs `any`, sem `ValidationPipe`) | ex.: `alunos.controller.ts:14` | Dados inválidos | ALTA |
| T27 | Usuários de semente sem perfil vinculado | `db.json` | Telas vazias na demonstração | ALTA (demonstrabilidade) |
| T28 | CORS aberto para qualquer origem nos dois servidores | `main.ts:6`, `server.js:9` | Superfície de ataque | BAIXA |
| T29 | Telas mortas (`Prof/page.tsx`, `VerAvisos.tsx`, `VerAvisosAdminEscolar.tsx`) | `AppRoutes.tsx:41,44,60` | Confusão | BAIXA |
| T30 | Acessibilidade: só 5 de 51 `<label>` têm `htmlFor`; cards de tipo de aviso são `div` com `onClick` (sem teclado); 5 atributos `aria-*`/`alt` no projeto inteiro | busca por `htmlFor` e `aria-` | WCAG | MÉDIA |
| T31 | Responsividade: menu fixo de 280 px sem *media query*; larguras fixas (900 px, `margin-left: 700px`) | `styles/sidebar.css:1-13`, `avisosAdminEscolar.css:11,113` | Celular/tablet | ALTA |

---

## 12. Matriz geral de aderência ao trabalho

> Inclui os itens de Engenharia de Requisitos do pedido inicial (seção 4.1), que **não são funções do sistema CRESCE**, mas da *documentação do trabalho*.

| Funcionalidade / Requisito | Situação atual | Evidência no código | Alteração necessária | Prioridade |
|---|---|---|---|---|
| RF01 | IMPLEMENTADO | `TelaCadastro.tsx`, `solicitacao-cadastro.service.ts` | Duplicidade de CNPJ | MÉDIA |
| RF02 | IMPLEMENTADO | `auth.service.ts` | Hash e logout (via RNF) | CRÍTICA |
| RF03 | IMPLEMENTADO / PRECISA DE AJUSTE | `Solicitacoes.tsx` | Confirmação, feedback, filtro de status, só decidir `PENDENTE` | ALTA |
| RF04 | PARCIALMENTE IMPLEMENTADO | `Escolas.tsx`, `escolas.controller.ts` | CRUD direto | ALTA |
| RF05 | IMPLEMENTADO | `Escola.tsx` | Status do pedido | MÉDIA |
| RF06–RF09 | PARCIALMENTE IMPLEMENTADO | `Professores/Alunos/Turmas/Disciplinas.tsx` | Edição + confirmação | ALTA |
| RF10 | IMPLEMENTADO / PRECISA DE AJUSTE | `AvisosAdminEscolar.tsx`, `Prof/Avisos.tsx` | Professor via API | MÉDIA |
| RF11, RF12 | IMPLEMENTADO | `Notas.tsx`, `Frequencia.tsx` | Validação no backend; vínculo | ALTA |
| RF13 | IMPLEMENTADO / PRECISA DE AJUSTE | `AvisosAlunos.tsx` | Endpoint dedicado "marcar lido" | MÉDIA |
| RF14 | PARCIALMENTE IMPLEMENTADO | `server.js` | Por escola, estado "disponível", download autenticado | ALTA |
| RNF01–RNF08 | ver seção 5 | — | — | — |
| Cadastro e gerenciamento de requisitos *dentro do sistema* | NÃO APLICÁVEL | — | É prática do processo (documento/PDF), não função do CRESCE | — |
| Classificação RF/RNF, requisitos de usuário × de sistema | NÃO APLICÁVEL (ao software) | — | Fazer no documento: os RFs do PDF são **requisitos de usuário**; sugere-se detalhar alguns como **requisitos de sistema** (ex.: RF11 → faixa 0–25, regra da nota final, quem pode editar) | ALTA (documentação) |
| Stakeholders | NÃO APLICÁVEL (ao software) | Perfis = `TipoUsuario` (`classes/tipo-usuario.ts`) | Documentar stakeholders além dos perfis (direção, secretaria, alunos) | MÉDIA |
| Regras de negócio | PARCIAL (implícitas no código) | Ex.: não excluir aluno em turma (`alunos.service.ts:100`), nota 0–25 (`Notas.tsx:212`), frequência < 75% = crítico | **Explicitar no documento** como RN01, RN02… (são ótimos exemplos de regra de negócio virando requisito) | ALTA (documentação) |
| Priorização / histórico / rastreabilidade | NÃO APLICÁVEL (ao software) | — | Matriz RF ↔ telas ↔ arquivos ↔ testes (as seções 4 e 7 deste documento já servem de base) | MÉDIA |
| Validação de requisitos | — | — | Usar a seção 9 como testes de aceitação; cada RF tem critério verificável | ALTA |
| Histórico de alterações de dados (auditoria) | NÃO IMPLEMENTADO / não exigido | — | Não consta nos RFs; não implementar | — |

---

## 13. Plano de implementação priorizado

> Princípios: reaproveitar telas, serviços e fluxos existentes; **não trocar tecnologias**. NestJS, json-server, React e PDFKit continuam. Nenhuma dependência nova é obrigatória: `bcrypt`, `@nestjs/config`, `class-validator` e `passport-jwt` **já estão instalados**.

### Fase 1 — Correções críticas e preparação da estrutura

| # | O que fazer | Por quê | Arquivos prováveis | Reaproveita | Dependências / banco | Critério de conclusão | Depende de |
|---|---|---|---|---|---|---|---|
| 1.1 | Criar os endpoints que faltam para as telas pararem de chamar o json-server: `GET /auth/me` com perfil completo (escola do admin, id do professor, alunos do responsável), `GET /escolas/:id`, filtros por escola em `/alunos`, `/professores`, `/turmas`, `/disciplinas`, `/avisos`, `GET /notas?turmaId`, `GET /frequencia?turmaId` | T1, RNF01/02/03 | `backend/src/*/*.controller.ts`, `*.service.ts` | Serviços existentes (já falam com o json-server) | — | Busca por `localhost:3001` em `frontend/src` retorna **0** | — |
| 1.2 | Usar `api.ts` em todas as telas com `baseURL` vindo de `VITE_API_URL` e um interceptor que envia `Authorization: Bearer` | T1, T21, RNF08 | `frontend/src/services/api.ts`, todas as páginas | `api.ts` existente | `.env` do frontend | Nenhuma URL `localhost` fixa nas páginas | 1.1 |
| 1.3 | Guard JWT global + `RolesGuard` + decorator `@Roles(...)` conforme a matriz da seção 6; checagem de dono (escola do admin, disciplina do professor, filho do responsável) | T2, RNF02 | `backend/src/auth/*` (novos `roles.guard.ts`, `roles.decorator.ts`), `app.module.ts`, controllers | `JwtStrategy`, `JwtAuthGuard` | — | Chamada sem token → 401; perfil errado → 403; admin da escola A em dado da escola B → 403 | 1.1 |
| 1.4 | Adicionar `escolaId` em aluno, professor, turma, disciplina e aviso no cadastro (manter os arrays atuais por compatibilidade) e corrigir a cascata da remoção para usar `escolaId` | T6, base para 1.3 | `*.service.ts` de criação, `solicitacao-remocao.service.ts` | Lógica atual | **Alteração no formato do `db.json`** (campo novo) | Remoção de uma escola não afeta outra com turma/disciplina de mesmo nome | — |
| 1.5 | Hash de senha com `bcrypt` no cadastro e no login; tirar a `senha` dos registros de perfil e das respostas | T3, T5, RNF03 | `auth.service.ts`, `alunos/professores/administrador-escolar.service.ts` | Fluxos atuais | **Migração do `db.json`** (re-hash da semente) | `db.json` sem senhas legíveis; login continua funcionando | — |
| 1.6 | Segredos em `.env` (JWT, SMTP) via `ConfigModule`; **revogar a senha de app do Gmail exposta**; `.env.example`; tirar os PDFs do git e incluí-los no `.gitignore` | T4, T9 | `auth.module.ts`, `jwt.strategy.ts`, `email.service.ts`, `.gitignore` | `ConfigModule` já importado | `.env` | Nenhum segredo no código | — |
| 1.7 | Criar o usuário **antes** de enviar o e-mail; e-mail em `try/catch` com aviso. **Modo demonstração** (variável de ambiente) que mostra a senha gerada uma vez para o admin quando o SMTP não estiver disponível | T8, demonstração | `alunos/professores/administrador-escolar.service.ts`, telas de cadastro | O backend já devolve `senha` no retorno | `.env` | Cadastro funciona sem internet em modo demonstração | 1.5 |
| 1.8 | Semente de demonstração coerente: 1 escola, 1 admin escolar, 1 professor, 2 alunos/responsáveis, 1 turma, 2 disciplinas, notas e chamadas | T27 | `backend/database/db.json` (ou script de semente) | — | **Dados** | As 4 personas fazem login e veem dados | 1.4, 1.5 |
| 1.9 | Logout real (chamar `logout()` em "Sair") | T10 | `Sidebar*.tsx`, `AuthContext.tsx` | `logout()` existente | — | Depois de sair, voltar a uma rota protegida redireciona para o início | — |
| 1.10 | Correções rápidas: crash em `TurmaDetalhes` (T12), `escolaId` da turma via API (T13), `setInterval` (T14), chaves de erro (T15), teste e2e (T20) | Estabilidade | arquivos citados | — | — | Itens corrigidos; `npm run test:e2e` passa | — |

### Fase 2 — Funcionalidades essenciais ausentes

| # | O que fazer | Por quê | Arquivos prováveis | Reaproveita | Banco | Critério de conclusão | Depende de |
|---|---|---|---|---|---|---|---|
| 2.1 | **Edição** de professores, alunos (com responsável), turmas (incluir e retirar alunos e disciplinas) e disciplinas (trocar professor): botão "Editar" na aba Visualizar, abrindo o mesmo formulário em modo edição, com **confirmação** | RF06–RF09, RNF07 | `Professores/Alunos/Turmas/Disciplinas.tsx`, `*.service.ts` (`update` passa a fazer PATCH parcial e atualizar `usuarios` quando o e-mail muda) | Formulários e `PUT` existentes | — | Editar e salvar com confirmação e mensagem; dados persistidos; e-mail de login atualizado | 1.1–1.3 |
| 2.2 | **RF04**: Admin do sistema cadastra, edita e remove escola diretamente. Extrair de `solicitacao-cadastro.service` a função "criar escola + admin" e de `solicitacao-remocao.service` a "remover escola em cascata", e usá-las nos dois fluxos | RF04 | `escolas.controller.ts/service.ts`, `Escolas.tsx` | Lógica das solicitações (aprovação) | — | Botões Novo/Editar/Excluir em Escolas, com confirmação | 1.3, 1.4 |
| 2.3 | **RF14**: mover a geração para um módulo `relatorios` no NestJS (reaproveitando o código PDFKit do `server.js`), **por escola**; registrar "disponibilizado em" por aluno; `GET /relatorios/meu` autenticado, que verifica o vínculo responsável–aluno; checar ≤ 5 MB | RF14, RNF03, RNF05 | novo `backend/src/relatorios/*`, `RelatorioFinal*.tsx`, remover `server.js` | Todo o layout do PDF | Novo registro/flag de relatório | O responsável só baixa o relatório do próprio filho, depois de disponibilizado; antes disso vê "ainda não disponível" | 1.3 |
| 2.4 | Validação no servidor: DTOs com `class-validator` + `ValidationPipe`; **CPF/e-mail únicos** com mensagem "Este CPF já está cadastrado"; nota 0–25; capacidade da turma | H5, H9, T26 | `*.controller.ts`, DTOs novos, `main.ts` | `class-validator` instalado | — | Teste: CPF repetido → 409 com mensagem exibida na tela | 1.1 |
| 2.5 | Definir e unificar a **regra da nota final** (requisito de sistema documentado) em um só lugar | T16, H4 | `notas.service.ts`, `Notas.tsx`, `NotasAlunos.tsx`, `Responsavel/page.tsx`, gerador do PDF | — | — | As 4 visões mostram o mesmo valor | — |
| 2.6 | Admin escolar acompanha o status das suas solicitações (edição/remoção) | Persona Michele, RF05 | `Escola.tsx`, `solicitacao-*.controller.ts` (filtro por `idEscola`) | Listagens existentes | — | Lista com status na tela Escola | 1.3 |
| 2.7 | Endpoints dedicados: `PATCH /avisos/:id/leitura` (RF13) e decisão de solicitação só quando `PENDENTE` (RF03) | T18, T19 | `avisos.*`, `solicitacao-*` | — | — | PUT genérico de aviso fechado para o responsável | 1.3 |
| 2.8 | (MÉDIA) Responsável com mais de um filho: seletor de aluno | Persona Breno | telas do responsável, `alunos.service.ts` | — | Um único usuário por e-mail | Duas crianças selecionáveis | 1.1 |
| 2.9 | (MÉDIA) Tela "Minhas turmas" do professor (no lugar de `Prof/page.tsx`) | Persona Lorenza | `Prof/page.tsx` | Lógica de filtro do Dashboard | — | Lista de turmas, disciplinas e alunos | 1.1 |

### Fase 3 — Interface, usabilidade e acessibilidade

| # | O que fazer | Heurística / RNF | Arquivos | Reaproveita | Critério de conclusão |
|---|---|---|---|---|---|
| 3.1 | Componente `ConfirmDialog` (modal com resumo da ação) no lugar de `window.confirm`, aplicado também em aprovar/rejeitar, salvar notas e frequência, pedir remoção e gerar relatórios | H5, RNF07 | novo `components/ConfirmDialog.tsx` + telas | Padrão `modal-overlay` existente | Toda ação de edição, exclusão ou aprovação pede confirmação |
| 3.2 | Componente `Feedback`/toast único (substitui as 8 cópias de `acionarModal`), com `aria-live` e exibição da mensagem do backend | H1, H9, H4 | novo componente + telas | CSS `modal-*` | Nenhuma ação termina sem retorno visual |
| 3.3 | Mensagem de erro **por campo** (texto abaixo do campo) | H9 | formulários | `campo-invalido` | Cada validação mostra texto e como corrigir |
| 3.4 | Responsividade: menu recolhível < 768 px (botão ☰), remover larguras fixas, tabelas com rolagem horizontal | RNF06, RNF08 | `styles/sidebar.css`, CSS das páginas | Media queries já existentes em `TelaInicial.css`/`Solicitacoes.css` | Navegação completa em 375 px sem rolagem horizontal da página |
| 3.5 | Acessibilidade: `htmlFor/id` em todos os labels; `lang="pt-BR"` e `index.html` corrigido; cards de tipo de aviso como `button`/`radio`; foco visível; contraste conferido | WCAG, RNF06 | formulários, `index.html`, CSS | — | Todos os formulários usáveis só com teclado; verificação do Lighthouse ≥ 90 em Acessibilidade |
| 3.6 | Ajuda: página "Como usar" por perfil + dicas "?" em Notas, Turmas e Relatório; explicar a escala de notas | H10 | novas rotas, menus | — | Item "Ajuda" em todos os menus |
| 3.7 | Eficiência: busca nas tabelas; filtro de status em Solicitações; "marcar todos presentes"; filtro por bimestre | H7 | telas citadas | — | Itens disponíveis |
| 3.8 | Linguagem: "Matrícula" → "CPF"; status traduzidos; segmento de ensino real; rótulos padronizados ("Excluir"); placeholder "E-mail" no login | H2, H4 | telas citadas | — | Revisão de textos concluída |
| 3.9 | Botões "Cancelar/Limpar"; indicador "carregando" em todas as listas; botão Salvar desabilitado durante o envio | H1, H3 | formulários | — | Itens presentes |
| 3.10 | Remover telas mortas e ícones emoji | H8 | `AppRoutes.tsx`, `VerAvisos*.tsx` | — | Nenhuma rota sem conteúdo |

### Fase 4 — Testes, validação e ajustes finais

| # | O que fazer | Critério de conclusão |
|---|---|---|
| 4.1 | Testes unitários do backend: guards/perfis (matriz da seção 6), validação de notas, CPF duplicado, cascata de remoção por `escolaId` | `npm test` verde; cada linha da matriz de permissões coberta |
| 4.2 | Corrigir e ampliar o e2e: login → ação permitida → ação proibida (403) por perfil | `npm run test:e2e` verde |
| 4.3 | Executar o roteiro da seção 9 com 1 a 2 pessoas por persona; registrar resultados **observados** | Planilha com sucesso, tempo, erros e comentários |
| 4.4 | Medir RNF04 (aba Network do DevTools) nas tarefas AV-L1, AV-M1, AV-A1 e AV-M4 | Tabela de tempos; todas ≤ 5 s ou plano de correção |
| 4.5 | Verificar RNF05 (tamanho do PDF com o máximo de disciplinas) | ≤ 5 MB registrado |
| 4.6 | RNF08: checklist em Chrome, Firefox e Edge (Windows) + Chrome Android (ou emulação) | Checklist preenchido com capturas |
| 4.7 | Atualizar o README (integrantes atuais, `.env`, passo a passo, contas de demonstração sem senha no texto) e as capturas da seção 10 | README revisado |

### Estimativa relativa de complexidade

| Fase | Complexidade | Esforço relativo | Justificativa |
|---|---|---|---|
| Fase 1 | **Alta** | ████████ 40% | Toca quase todas as telas (59 chamadas), o modelo de dados e a autenticação |
| Fase 2 | **Média** | ██████ 30% | Edições reaproveitam formulários; RF04/RF14 reaproveitam lógica existente |
| Fase 3 | **Média-baixa** | ████ 20% | Componentes compartilhados + CSS; mudanças visíveis e fáceis de demonstrar |
| Fase 4 | **Baixa-média** | ██ 10% | Testes focados + execução de roteiros |

**Ordem recomendada:** 1.6 → 1.5 → 1.4 → 1.1 → 1.2 → 1.3 → 1.7 → 1.8 → 1.9/1.10 → 2.4 → 2.1 → 2.2 → 2.3 → 2.5 → 3.1/3.2 → 3.3–3.10 → 2.6–2.9 (se houver tempo) → Fase 4.
*Atalho para a apresentação:* se o prazo for curto, priorize **1.7, 1.8, 1.10, 2.1, 2.4 (CPF duplicado), 3.1, 3.2 e 3.4**. São as mudanças mais visíveis para RNF07 e as heurísticas. Registre a Fase 1 de segurança como "risco conhecido e plano de mitigação", o que também é conteúdo de Engenharia de Requisitos.

---

## 14. Reaproveitar × desenvolver

| Item | Decisão | Motivo |
|---|---|---|
| Todas as telas (layout, CSS, navegação por perfil, menus) | **Reaproveitar** | Organizadas, consistentes e já demonstram as heurísticas |
| Fluxo de solicitação → aprovação → criação de escola/admin → e-mail | **Reaproveitar** (reordenar criação/e-mail) | Completo e aderente a RF01/RF03 |
| Notas e frequência (telas + serviços com criação/atualização) | **Reaproveitar** + validação no servidor | Funcionais |
| Avisos e confirmação de leitura | **Reaproveitar** + endpoint de leitura | Funcionais |
| Layout do PDF (PDFKit) | **Reaproveitar** dentro do NestJS | Bom resultado visual, arquivos leves |
| Validadores do frontend (`utils/validadores.ts`) | **Reaproveitar** (e espelhar no backend) | Corretos para o formato |
| Lógica de cascata da remoção | **Reaproveitar e corrigir** (usar `escolaId`) | Já cobre todas as coleções |
| Camada de acesso a dados do frontend (chamadas axios espalhadas) | **Refazer as chamadas**, não as telas | Requisito de segurança |
| Autenticação/autorização | **Completar** (guards, roles, hash) | Hoje é só visual |
| Edições (RF04, RF06–RF09) | **Desenvolver** (com base nos formulários existentes) | Ausentes |
| Servidor `server.js` | **Substituir** por um módulo NestJS | Sem autenticação, processo extra |
| Telas mortas, classes de domínio sem uso | **Remover ou atualizar** | Código legado |
| json-server como banco | **Manter** | Trocar de banco não é necessário para os RNFs se ele ficar acessível só pelo backend (limitação a registrar no documento) |

**Estimativa de aproveitamento:** cerca de **70%** do código pode ser mantido como está ou com ajustes pequenos (telas, CSS, fluxos, serviços, PDF). Os ~30% restantes concentram-se na camada de acesso a dados do frontend, na autorização do backend e nas edições que faltam.

---

## 15. Conclusão objetiva

**1. O quanto do projeto pode ser reaproveitado?**
Cerca de **70%**. Todas as telas e os fluxos de negócio dos 14 RFs existem; o retrabalho se concentra em segurança/arquitetura (acesso a dados e permissões) e nas edições.

**2. Situação dos 14 RFs:**
**8 implementados** (RF01, RF02, RF03, RF05, RF10, RF11, RF12, RF13) · **6 parciais** (RF04, RF06, RF07, RF08, RF09, RF14) · **0 ausentes** · **0 não validados** pelo código. Nenhum foi executado, então a validação em execução fica para a Fase 4.

**3. Situação dos 8 RNFs:**
**1 atendido** (RNF05) · **4 parcialmente atendidos** (RNF01, RNF06, RNF07, RNF08) · **2 não atendidos** (RNF02, RNF03) · **1 não validado** (RNF04).

**4. Quais personas já usam o sistema de ponta a ponta?**
- **Lorenza (Professora): sim**, nas tarefas principais (notas, frequência, avisos).
- **Breno (Responsável): quase**. Consultas e avisos funcionam; o relatório depende de geração prévia e a nota final tem cálculo inconsistente.
- **Alfredo (Admin do Sistema): sim para RF03**, não para RF04 (não cadastra nem edita escolas diretamente).
- **Michele (Admin Escolar): não completamente**. Cadastra e exclui, mas não edita professores, alunos, turmas ou disciplinas.
- Para todas: a demonstração depende de 4 processos no ar e do envio de senha por e-mail (T8/T27).

**5. Principais problemas de usabilidade**
1. Ausência de **edição**: corrigir um erro obriga a excluir e recadastrar (H3).
2. **Falta de confirmação** em aprovar/rejeitar, inclusive na remoção em cascata, e ao sobrescrever notas (H5/RNF07).
3. **Nota final com regras diferentes** em cada tela (H4).
4. **Mensagens de erro genéricas ou invisíveis** (campos que não ficam vermelhos; nota fora do intervalo ignorada; "CPF já cadastrado" inexistente) (H9).
5. **Sem layout para celular** (menu fixo de 280 px) e acessibilidade fraca (labels, teclado, `lang`) (RNF06/RNF08).
6. Ações sem retorno visual (aprovar solicitação, salvar notas sem estado de "salvando") (H1).
7. Ausência de ajuda e de busca/filtros nas listagens (H10/H7).

**6. Funcionalidades prioritárias para o novo trabalho**
1. Autorização real no backend e fim do acesso direto ao json-server (RNF01/RNF02).
2. Senhas com hash e segredos fora do código, com revogação da credencial exposta (RNF03).
3. **Edição com confirmação** de professores, alunos, turmas e disciplinas (RF06–RF09 + RNF07).
4. **CRUD direto de escolas** pelo admin do sistema (RF04).
5. **Relatório final por escola, com estado "disponibilizado" e download autenticado** (RF14).
Além disso, para viabilizar a apresentação: semente de demonstração e modo sem SMTP (1.7/1.8), "CPF já cadastrado" (2.4) e componentes de confirmação/feedback (3.1/3.2).

**7. Maiores riscos técnicos**
Vazamento de senhas pelo json-server aberto; credencial de e-mail no histórico do git; remoção em cascata que pode apagar dados de outra escola (vínculo por nome/código); cadastro pela metade quando o SMTP falha; colisão de IDs em `usuarios`; ausência de testes para garantir que as correções de segurança não quebrem os fluxos.

**8. Exemplos reais que já podem ser usados na apresentação**
Formulário de solicitação com validação e modal (RF01/H1/H5); login levando a quatro painéis distintos (RF02/separação de perfis); cards de solicitações com selos de status (RF03/H1); confirmação de exclusão e bloqueio "Aluno pertence a uma turma." (H5/H9); tabela de notas com filtros encadeados e limite 0–25 (RF11/H5/H7); chamada por data (RF12/H7); avisos com filtro "Não lidos" e "Marcar como lido" + contador "x/y lidos" (RF10/RF13/H1); legenda de frequência Excelente/Atenção/Crítico (H2/H10); mensagem específica do boletim para aluno sem turma (H9); botão "Gerando Documentos..." e o PDF gerado (RF14/H1). Como contraponto crítico: nota final inconsistente, aprovação sem confirmação, "Matrícula" mostrando CPF e menu quebrando no celular.

**9. Ordem de execução das próximas tarefas**
Fase 1 (segredos → hash → `escolaId` → endpoints → `api.ts` → guards → modo demonstração/semente → logout e correções rápidas) → Fase 2 (validação/CPF único → edições → RF04 → RF14 → regra de nota) → Fase 3 (confirmação e feedback → erros por campo → responsividade/acessibilidade → ajuda) → Fase 4 (testes, roteiro por persona, medições de RNF, README e capturas).

---

*Aguardando a aprovação do diagnóstico pela equipe antes de qualquer implementação.*
