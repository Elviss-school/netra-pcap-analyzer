# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Wireshark Plugin

## Prerequisites

1. Wireshark Installed
2. Lua support enabled (default in most Wireshark Builds)

## Step-by-Step Setup

1. Open <strong>Wireshark</strong>
2. Navigate to:
```Help → About Wireshark → Folders```
3. Locate the <strong>Personal Lua Plugins</storng> directory
4. Copy the plugin file into that folder:
```netra.lua```
5. Restart <strong>Wireshark</strong>
6. Go to
```Tools → Netra Help```

## Website Integration

When <strong>Netra Help</strong> is clicked, the plugin redirects the user to:
```https://netra-test-c3b95.web.app/```
From there, users can:
1. Upload PCAP files
2. Use AI-Guided learning
3. See interactive visualizations
4. Game-based learning

