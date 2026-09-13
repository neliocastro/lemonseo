export interface AdminTool {
  slug: string;
  title: string;
  description: string;
  href: string;
}

/**
 * Fonte única das ferramentas exibidas em /admin/ferramentas — adicionar uma
 * nova ferramenta aqui basta para que ela apareça no índice, sem tocar no
 * layout ou na navegação.
 */
export const ADMIN_TOOLS: AdminTool[] = [
  {
    slug: "links-quebrados",
    title: "Rastreador de links quebrados",
    description: "Varre uma página e checa o status de cada link interno/externo encontrado.",
    href: "/admin/ferramentas/links-quebrados",
  },
  {
    slug: "sitemap",
    title: "Relatório de sitemap",
    description:
      "Localiza o(s) sitemap(s) do site e consolida sintaxe, boas práticas e coerência com o robots.txt.",
    href: "/admin/ferramentas/sitemap",
  },
];
