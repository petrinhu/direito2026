import { defineConfig, devices } from '@playwright/test';

// Seção 14 da arquitetura: o portão automático é Blink, e só Blink. O
// Playwright aponta por executablePath para binários já instalados nesta
// máquina; nenhum navegador é baixado (decisão do líder, 21/09/2026,
// seção 16). Gecko e WebKit ficam de fora do automático, por desenho, não
// por esquecimento (ver seção 14 e docs/compatibilidade-navegadores.md,
// seção 8).
//
// Dois alvos Blink, não um (ordem do líder, 22/09/2026): "chromium" (o
// binário genérico já usado) e "brave" (o navegador que o líder usa no
// dia a dia, com bloqueador próprio ligado por padrão — o tipo de coisa
// capaz de esconder um recurso sem gerar erro visível, e que só aparece
// rodando neste navegador específico). Os dois caminhos são
// configuráveis por variável de ambiente, com padrão apontando para o
// binário já instalado nesta máquina, para não quebrar noutra.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: 'blink',
      use: {
        ...devices['Desktop Chrome'],
        // Blink e Edge são o mesmo motor; apontar para um dos dois
        // binários já instalados cobre a dupla sem baixar nada (L-57).
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
