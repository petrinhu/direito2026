import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// Ponta a ponta do portão de acesso (plano do CTO do login único, seção 7.4). Diferente do
// playwright.config.ts (estudo, vite preview com a SPA e a API mockada), aqui o php -S roda o
// roteador de desenvolvimento e o portão de verdade, com privado e app sintéticos.
//
// Um worker só, sem paralelismo: todos os testes dividem o mesmo privado (usuarios.json,
// tentativas.json), e o limite de tentativas é estado compartilhado. Cada teste reinicia o
// privado antes de rodar (resetarPrivado). Sem retry: falha intermitente é bug, não se re-roda
// (plano 10, flakiness).
//
// Navegadores, por executablePath, sem baixar nada (L-51, L-57):
//  - "chromium": /usr/bin/chromium-browser (padrão), ou PLAYWRIGHT_CHROMIUM_PATH;
//  - "brave": /usr/bin/brave-browser (padrão), ou PLAYWRIGHT_BRAVE_PATH; só o executável.
//
// E2E_PORTAO_RAIZ aponta para outra árvore (a sabotagem usa uma cópia extraída do commit).
const PORTA = 4741;

export default defineConfig({
  testDir: './tests/e2e-portao',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  outputDir: process.env.E2E_PORTAO_SAIDA ?? 'test-results/portao',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'off',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node --import tsx tests/e2e-portao/apoio/subir.ts',
    url: `http://localhost:${PORTA}/entrada.css`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...(process.env.E2E_PORTAO_RAIZ ? { E2E_PORTAO_RAIZ: process.env.E2E_PORTAO_RAIZ } : {})
    }
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/bin/chromium-browser'
        }
      }
    },
    {
      name: 'brave',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_BRAVE_PATH ?? '/usr/bin/brave-browser'
        }
      }
    }
  ]
});
