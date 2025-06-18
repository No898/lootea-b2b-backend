import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "intro",
    {
      type: "category",
      label: "🛠️ Setup & Konfigurace",
      items: [
        "setup-configuration/installation",
        "setup-configuration/environment-setup",
      ],
    },
    {
      type: "category",
      label: "🏗️ Architektura systému",
      items: [
        "system-architecture/overview",
        "system-architecture/database-design",
        "system-architecture/order-lifecycle",
        "system-architecture/payment-flow",
      ],
    },
    {
      type: "category",
      label: "📚 API Dokumentace",
      items: ["api-documentation/graphql-schema"],
    },
    {
      type: "category",
      label: "🔗 Frontend Integrace",
      items: ["frontend-integration/nextjs-setup"],
    },
    {
      type: "category",
      label: "🚀 Deployment",
      items: ["deployment/railway-setup"],
    },
  ],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    'intro',
    'hello',
    {
      type: 'category',
      label: 'Tutorial',
      items: ['tutorial-basics/create-a-document'],
    },
  ],
   */
};

export default sidebars;
