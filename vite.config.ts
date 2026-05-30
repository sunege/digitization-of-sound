import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 設定。教育用途のシンプルな構成のため最小限。
export default defineConfig({
  plugins: [react()],
});
