# MontaÊ — Sistema de Gestão & Montagens de Móveis

> **MONTA. REPARA. CONECTA.**  
> Sistema completo para gestão de serviços de montagem de móveis, controle financeiro, painel de campo mobile para montadores com **assinatura digital dupla em tempo real**, gerador de links públicos de orçamentos e emissão de comprovantes formais com garantia de 90 dias.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + Vite
- **Estilização:** Vanilla CSS Moderno (Design System Dark Graphite & Brushed Gold inspirado na identidade visual oficial da MontaÊ)
- **Ícones:** Lucide React
- **Assinatura Digital:** Canvas Touchscreen & Stylus de alta precisão
- **Efeitos e UI:** Canvas Confetti

---

## 📱 Principais Funcionalidades

1. **Painel Geral (Dashboard):**
   - Faturamento total acumulado, despesas operacionais e lucro líquido real.
   - Montagens em andamento e alerta instantâneo de novos orçamentos recebidos pelo link público.

2. **Cadastro & CRM de Clientes:**
   - Gestão completa de clientes com integração direta para conversas no WhatsApp (`wa.me`).
   - Registro de endereços, especificações de ambiente (ex: parede de drywall, prédio com elevador) e histórico de montagens.

3. **Painel do Montador em Campo (Mobile-First):**
   - Interface adaptada para celular do montador.
   - Acesso rápido a rotas no **Google Maps / Waze** e WhatsApp do cliente.
   - **Checklist de qualidade pré-entrega** (nivelamento, portas reguladas, corrediças testadas, fixação segura).
   - **Assinatura Digital Dupla em Tela:** Coleta em tempo real da assinatura do montador técnico e do cliente vistoriante com carimbo de data/hora.

4. **Comprovante de Conclusão & Termo de Garantia de 90 Dias:**
   - Visualização e impressão/PDF estilizados com o logo oficial da MontaÊ, descrição dos móveis, dados do cliente e **ambas as assinaturas digitais capturadas**.

5. **Gerador de Links de Orçamentos para Clientes:**
   - Link compartilhável direto (`/#orcamento`) para envio no WhatsApp com mensagem pronta.
   - Simulador interativo onde o cliente escolhe os cômodos, tipos de móveis, condições (novo na caixa ou desmontagem/remontagem) e solicita data de atendimento.
   - O pedido entra em tempo real no painel administrativo para aprovação com 1 clique.

6. **Gestão Financeira & Comissões:**
   - Fluxo de caixa com entradas e saídas (combustível, brocas, ferramentas, ferragens).
   - Demonstrativo automático de comissões por montador da equipe.

---

## 💻 Como Rodar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/santwoxx/cliente-montae.git
cd cliente-montae
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse no navegador: `http://localhost:3000/`  
Para o link de orçamento do cliente: `http://localhost:3000/#orcamento`

4. Para gerar a build de produção:
```bash
npm run build
```

---

## 📧 Contato do Montador Responsável

- **Responsável Técnico:** Marcos Elias
- **E-mail:** `marcos.elias.sc@gmail.com`
- **Slogan:** *MONTA. REPARA. CONECTA.*
