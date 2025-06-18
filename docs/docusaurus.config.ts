import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "B2B E-shop Backend Dokumentace",
  tagline: "Node.js + Fastify + GraphQL + JWT pro B2B bubble tea e-shop",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://your-domain.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "your-organization", // Usually your GitHub org/user name.
  projectName: "b2b-eshop-backend", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "cs",
    locales: ["cs"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/", // Dokumenty na hlavní stránce
          editUrl: undefined, // Vypnout "Edit this page"
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false, // Vypnout blog
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ["@docusaurus/theme-mermaid"],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "🧋 B2B E-shop Backend",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "📖 Dokumentace",
        },
        {
          type: "search",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Dokumentace",
          items: [
            {
              label: "🛠️ Setup",
              to: "/setup-configuration/installation",
            },
            {
              label: "🏗️ Architektura",
              to: "/system-architecture/overview",
            },
            {
              label: "📚 API",
              to: "/api-documentation/graphql-schema",
            },
          ],
        },
        {
          title: "Technologie",
          items: [
            {
              label: "Node.js + Fastify",
              href: "https://fastify.dev/",
            },
            {
              label: "GraphQL",
              href: "https://graphql.org/",
            },
            {
              label: "Prisma",
              href: "https://prisma.io/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} B2B E-shop Backend. Postaveno s ❤️ a Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["ruby", "graphql", "json", "bash"],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
