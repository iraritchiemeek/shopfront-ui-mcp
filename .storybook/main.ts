import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../widgets/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: { name: "@storybook/react-vite", options: {} },
  // Storybook auto-bundles `public/` from the project root if staticDirs is
  // unset. Our `public/` is the Cloudflare Workers Static Assets dir and
  // already contains a prior `public/storybook` build — auto-bundling created
  // a recursive nesting that doubled storybook-static on each build (8.5 GB).
  staticDirs: [],
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    if (process.env.STORYBOOK_BASE_PATH) {
      config.base = process.env.STORYBOOK_BASE_PATH;
    }
    // Vite's `publicDir` defaults to `<root>/public`. Our `public/` is the
    // Cloudflare Workers Static Assets dir and contains a prior Storybook
    // build — leaving Vite to auto-copy it produces nested `storybook/` and
    // `ui-apps/` dirs in the output that grow on every rebuild.
    config.publicDir = false;
    return config;
  },
};

export default config;
