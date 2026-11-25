import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// Suíte Firefox do AV3-F0c-HIFEN: o Firefox do Playwright (ordem do líder, 25/11/2026, L-51) só para
// medir a hifenização do modo adaptado (hyphens: auto, lang pt-BR), que o Chromium desta máquina não
// mostra. Fica fora do test:e2e, do test:e2e:portao e do pré-CI: roda só por
// `npm run test:e2e:firefox`. Um worker, sem retry: falha intermitente é bug, não se re-roda.
//
// Porta própria (4273), para não disputar com a suíte do estudo (4173) nem com o portão (4741).
const PORTA = 4273;

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e-firefox/**/*.spec.ts', 'e2e/menu-lateral-sem-estouro.spec.ts'],
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  outputDir: 'test-results/firefox',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'off',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: `npm run preview -- --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 30_000
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ]
});
