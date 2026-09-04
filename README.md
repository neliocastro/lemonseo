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
- `DATABASE_URL` — conexão Postgres (Neon). Sem ela, cai no fallback em JSON local (ver
  "Persistência" abaixo). Em produção na Vercel já vem configurada automaticamente pela
  integração do Neon.

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

## Persistência

`lib/store.ts` usa **Postgres (Neon)** via `DATABASE_URL` quando a variável está definida —
é o caso em produção na Vercel (instalado como integração de marketplace: `vercel integration
add neon`). Duas tabelas simples (`reports`, `leads`) guardam o relatório/lead inteiro como
JSONB, sem ORM. Sem `DATABASE_URL` (ex: rodando local sem configurar o banco), cai para um
fallback em `data/reports.json` e `data/leads.json` só para não travar o desenvolvimento —
esse fallback é efêmero em produção (filesystem de serverless functions não persiste entre
execuções) e não deve ser usado ali.

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

## Deploy

Em produção: **https://lemonseo.vercel.app** (projeto `nelio-castros-projects/lemonseo` na
Vercel, banco Neon Postgres conectado via integração de marketplace). `vercel git connect`
para deploy automático a cada push ainda não foi possível via CLI (a Vercel pediu para
autorizar a GitHub App manualmente) — configurar isso no dashboard da Vercel se quiser esse
fluxo; por enquanto o deploy é feito rodando `vercel --prod` neste diretório.

## Próximos passos (fora do escopo deste MVP)

- E-mail transacional (Resend) para o modal "Receber por e-mail" e notificação de novo lead.
- Rate limiting / proteção contra abuso (Cloudflare Turnstile) no formulário público.
- Exportação de PDF de verdade (hoje usa `window.print()`).

Detalhes completos no plano em `~/.claude/plans/analise-essa-pasta-seo-fluttering-fairy.md`.
