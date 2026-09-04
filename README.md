# 🍋 LemonSEO

Analise seu site em segundos: Velocidade, SEO, GEO (busca por IA), E-E-A-T, Imagens, Mobile,
Analytics, Subpáginas, Palavra-chave e Semântica — relatório completo em linguagem simples.
MVP construído com Next.js (App Router) + TypeScript, estilizado com o design system
**Lemon Tech**.

Ver o plano completo do produto em
`~/.claude/plans/analise-essa-pasta-seo-fluttering-fairy.md`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) (ou a porta configurada).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha o que tiver disponível:

- `PAGESPEED_API_KEY` — opcional. Sem ela, a nota de Velocidade usa o tempo de resposta do
  fetch como fallback em vez dos dados reais do Google PageSpeed Insights.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — número usado nos botões de WhatsApp (CTA final e flutuante).
- `ADMIN_PASSWORD` — obrigatória para usar o painel `/admin` (ver seção abaixo).

## Como funciona

1. `POST /api/analyze` recebe a URL (+ palavra-chave opcional), busca o HTML do site e roda em
   paralelo: PageSpeed Insights, SEO on-page, imagens (incluindo peso real via `HEAD` em cada
   imagem), mobile, analytics, GEO (`/llms.txt`, `/llms-full.txt`, robots.txt, Schema.org,
   HTML5 semântico), E-E-A-T (CNPJ, FAQ, depoimentos, política de privacidade, contato),
   semântica (frequência de palavras, legibilidade) e até 10 subpáginas — cada uma analisada
   individualmente (`lib/analyzers/*`). Calcula as notas (`lib/scoring.ts`) e salva o relatório.
2. O usuário é redirecionado para `/analise/[slug]`, que renderiza o relatório salvo — link
   permanente e compartilhável, com 11 abas de detalhamento.
3. Qualquer contato feito na tela de resultado (e-mail no modal, clique no WhatsApp) é
   registrado via `POST /api/lead`.

## Persistência (MVP)

Por padrão os relatórios e leads ficam em `data/reports.json` e `data/leads.json`
(`lib/store.ts`) — funciona bem em desenvolvimento, mas é efêmero em produção na Vercel
(filesystem de serverless functions não é persistente entre execuções). Antes de ir para
produção, troque `lib/store.ts` por um banco gerenciado (Neon ou Vercel Postgres), mantendo a
mesma interface de funções (`saveReport`, `getReport`, `saveLead`, `listLeads`,
`listReports`) — os outros arquivos não precisam mudar.

## Painel /admin

`/admin` lista os leads capturados e os relatórios gerados. Protegido por senha única
(`ADMIN_PASSWORD`) via `proxy.ts` (equivalente ao antigo `middleware.ts` no Next.js 16) — sem
a variável configurada, o login sempre falha. A sessão é um cookie `httpOnly` assinado
(HMAC da senha), sem banco de sessão — suficiente para um único usuário administrador; se o
time crescer, trocar por uma sessão de verdade (ex: NextAuth). O header do admin tem um botão
para alternar entre os temas claro/escuro do Lemon Tech (`components/ThemeToggle.tsx`),
persistido em `localStorage`.

## Design system

Os tokens do Lemon Tech estão em `app/styles/lemon-tech.css` (copiados de
`~/.claude/skills/lemon-tech/tokens.css`). Os componentes específicos do produto (formulário,
tela de progresso, anel de nota, abas, cards de métrica, botão de WhatsApp, modais) estão em
`app/globals.css`, construídos em cima das classes `.lt-*` do kit base — veja
`~/.claude/skills/lemon-tech/demo.html` como referência de uso.

## Próximos passos (fora do escopo deste MVP)

- Banco de dados real (Neon/Vercel Postgres) no lugar do JSON local.
- E-mail transacional (Resend) para o modal "Receber por e-mail" e notificação de novo lead.
- Rate limiting / proteção contra abuso (Cloudflare Turnstile) no formulário público.
- Exportação de PDF de verdade (hoje usa `window.print()`).

Detalhes completos no plano em `~/.claude/plans/analise-essa-pasta-seo-fluttering-fairy.md`.
