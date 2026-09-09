# MontaÊ · Sistema de Gestão de Montagens

Sistema web para empresas de montagem de móveis: ordens de serviço, CRM de clientes,
controle financeiro, comissões, assinatura digital dupla em campo e link público de
orçamento.

**Stack:** React 19 + Vite 6 + Firebase (Firestore + Auth) · hospedagem na Vercel
**Custo:** R$ 0 — roda inteiro nos planos gratuitos (Firebase Spark + Vercel Hobby)

---

## Índice

1. [O que o sistema faz](#o-que-o-sistema-faz)
2. [Rodar na sua máquina](#rodar-na-sua-máquina)
3. [Configurar o Firebase (obrigatório)](#configurar-o-firebase-obrigatório)
4. [Publicar na Vercel](#publicar-na-vercel)
5. [Primeiro acesso e liberação de usuários](#primeiro-acesso-e-liberação-de-usuários)
6. [Controle de mensalidade](#controle-de-mensalidade)
7. [Backup dos dados](#backup-dos-dados)
8. [Estrutura do projeto](#estrutura-do-projeto)

---

## O que o sistema faz

| Área | Recursos |
| --- | --- |
| **Painel** | Faturamento, lucro, ticket médio, montagens ativas, gráfico de caixa de 6 meses, próximas montagens com aviso de atraso |
| **Ordens** | Busca, filtros por situação, ordenação, edição, atribuição de montador, aprovação de orçamento, exportação CSV, atalhos de WhatsApp e rota no mapa |
| **Clientes (CRM)** | Cadastro com validação, histórico de serviços e faturamento por cliente, exportação CSV |
| **Financeiro** | Receitas e despesas por categoria, filtro por mês, totais do recorte, comissão por montador, exportação CSV — **visível apenas para administradores** |
| **Painel do montador** | Lista das próprias montagens, rota GPS, checklist de qualidade, assinatura digital dupla (montador + cliente), avaliação por estrelas |
| **Comprovante** | Documento com itens, checklist, termo de garantia e as duas assinaturas — pronto para imprimir, salvar em PDF ou enviar pelo WhatsApp |
| **Link público** | Cliente monta o próprio orçamento e o pedido cai direto na aba Ordens. Gera QR Code para imprimir |
| **Configurações** | Dados da empresa, equipe de montadores, liberação de acessos, backup e restauração |

Funciona **offline**: o Firestore mantém um cache local, e o app pode ser instalado
como aplicativo no celular (PWA).

---

## Rodar na sua máquina

```bash
npm install
npm run dev      # http://localhost:3000
```

Outros comandos:

```bash
npm run build    # gera a pasta dist/
npm run preview  # testa o build de produção em http://localhost:4173
```

> Sem as chaves do Firebase o sistema entra em **modo local**: tudo funciona, mas os
> dados ficam apenas naquele navegador e não há tela de login.

---

## Configurar o Firebase (obrigatório)

As chaves do projeto já estão em [`src/lib/firebase.js`](src/lib/firebase.js). Elas são
públicas por natureza — no Firebase a segurança vem das **regras do Firestore**, não do
sigilo da chave. Ainda assim, três passos no console são obrigatórios:

### 1. Ativar os métodos de login

Firebase Console → **Authentication** → **Sign-in method** → ative:

- ✅ **E-mail/senha** — usado pela equipe
- ✅ **Anônimo** — usado pelo visitante do link público (sem isso o orçamento não é enviado)

### 2. Criar o banco

Firebase Console → **Firestore Database** → **Criar banco de dados** → modo produção →
região `southamerica-east1` (São Paulo).

### 3. Publicar as regras de segurança  ⚠️ passo mais importante

Sem isso o sistema não lê nem grava nada.

```bash
npx firebase login
npx firebase use --add          # escolha o projeto
npm run deploy:rules
```

Ou, manualmente: Console → Firestore → **Regras** → cole o conteúdo de
[`firestore.rules`](firestore.rules) → **Publicar**.

### O que as regras garantem

- Quem se cadastra nasce como `pendente` e **não enxerga nenhum dado** até ser liberado.
- Ninguém consegue se auto-promover a administrador — o campo `role` é protegido.
- **Montadores não acessam o financeiro.**
- O visitante anônimo só consegue **criar** um orçamento: não lê, não altera e não apaga nada.
- O documento `settings/licenca` é somente leitura para todos, inclusive para o
  administrador do cliente.

---

## Publicar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
   `santwoxx/cliente-montae`.
2. A Vercel detecta o Vite sozinho. O [`vercel.json`](vercel.json) já define rotas,
   cache e cabeçalhos de segurança.
3. **Deploy**.

Depois, no Firebase Console → **Authentication** → **Settings** → **Authorized domains**,
adicione o domínio da Vercel (ex.: `cliente-montae.vercel.app`), senão o login é recusado.

### Variáveis de ambiente (opcional)

Só é necessário se você quiser apontar para **outro** projeto Firebase:

```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
VITE_OWNER_EMAIL
```

---

## Primeiro acesso e liberação de usuários

Como ninguém pode se cadastrar já como administrador, o **primeiro admin é liberado à mão**:

1. Abra o sistema e clique em **Criar agora** para cadastrar seu e-mail e senha.
2. Você verá a tela *"Acesso aguardando liberação"*.
3. Firebase Console → **Firestore Database** → coleção **`users`** → abra o documento
   com o seu e-mail e altere:
   - `role` → `admin`
   - `active` → `true`
4. Volte ao sistema e clique em **"Já liberei, atualizar"**.

Dali em diante, todos os outros acessos são liberados dentro do próprio sistema, em
**Configurações → Acessos**, escolhendo entre `Montador` e `Administrador`.

---

## Controle de mensalidade

O sistema foi entregue em **08/09/2026** e a primeira mensalidade vence em **08/10/2026**.
A partir do vencimento, o sistema exibe uma tela de bloqueio com o WhatsApp do suporte
**(73) 99142-2872**.

O comportamento é controlado pelo documento **`settings/licenca`** no Firestore, que
**somente o desenvolvedor** pode alterar (as regras bloqueiam o cliente).

### Liberar o acesso quando o cliente pagar

Firebase Console → **Firestore Database** → coleção `settings` → documento `licenca`
(crie se não existir) → defina:

| Campo | Tipo | Valor |
| --- | --- | --- |
| `paidUntil` | string | `2026-11-08` — próxima data de bloqueio |

O desbloqueio é **imediato**: o app escuta esse documento em tempo real, sem precisar de
novo deploy nem recarregar a página.

### Outros campos aceitos

| Campo | Tipo | Efeito |
| --- | --- | --- |
| `blocked` | boolean | `true` bloqueia na hora, mesmo antes do vencimento |
| `message` | string | Substitui o texto exibido na tela de bloqueio |
| `plan` | string | `vitalicia` remove o bloqueio permanentemente |

### Detalhes do funcionamento

- **Aviso antecipado:** nos 7 dias anteriores ao vencimento aparece uma faixa vermelha no
  topo do sistema, com botão direto para o WhatsApp — o bloqueio nunca pega de surpresa.
- **Proteção contra relógio atrasado:** o sistema guarda a maior data já vista. Atrasar a
  data do aparelho não libera o acesso.
- **Sem internet:** vale a última licença conhecida; se nunca houve contato, vale a data
  padrão do contrato.
- **Os dados nunca são apagados** pelo bloqueio — apenas o acesso fica suspenso.
- **O link público** mostra um aviso neutro de manutenção, e não a cobrança: a pendência
  financeira não é exposta aos clientes finais da empresa.

Para alterar prazos, telefone ou tolerância, edite `LICENSE_INFO` em
[`src/services/license.js`](src/services/license.js).

---

## Backup dos dados

Em **Configurações → Dados**:

- **Baixar backup** — gera um `.json` com clientes, ordens, montadores, lançamentos e
  configurações.
- **Restaurar backup** — regrava o conteúdo do arquivo.

Recomendação: baixar um backup por mês e guardar no Google Drive.

---

## Estrutura do projeto

```
src/
├─ lib/firebase.js          Inicialização do Firebase + cache offline
├─ services/
│  ├─ db.js                 Camada única de dados (Firestore ou local)
│  ├─ localDb.js            Banco local com cache, migrações e sync entre abas
│  ├─ auth.js               Login, papéis e mensagens de erro em português
│  ├─ license.js            Regras da mensalidade
│  ├─ calculations.js       Catálogo, preços, formatação e exportação CSV
│  └─ seed.js               Dados iniciais de demonstração
├─ context/                 Estado global (auth, dados, licença, avisos)
├─ components/              Componentes reutilizáveis
├─ views/                   Telas
└─ styles/index.css         Design system completo

firestore.rules             Regras de segurança  ← precisa ser publicado
vercel.json                 Rotas, cache e cabeçalhos de segurança
public/sw.js                Service worker (funcionamento offline)
```

### Decisões técnicas

- **Camada de dados única.** As telas nunca falam com o Firestore direto, então trocar o
  back-end não exige mexer na interface.
- **Cache persistente do Firestore.** O app abre instantâneo, funciona sem sinal dentro de
  prédios e economiza a cota gratuita de leituras.
- **Divisão de código.** Cada tela é baixada só quando aberta.
- **Numeração de OS por transação.** Dois celulares criando ordens ao mesmo tempo nunca
  recebem o mesmo número.

---

© MontaÊ — Monta. Repara. Conecta.
