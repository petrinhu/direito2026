import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// E2E no ar (V17-F3, OS 3.6). Roda só por scripts/e2e-ar.sh, que sobe a caixa (--caixa) ou aponta
// para o ar (--ar, travado por E2E_AR_LIBERADO=1) e entrega o caminho do segredo por E2E_AR_SEGREDO.
// Nenhuma senha passa por aqui.
// Um worker, sem retry: falha intermitente é bug, e repetir a rodada gastaria contas e tentativas do limite.
// Nenhum artefato que guarde URL ou DOM: sem trace, sem vídeo, sem captura de tela. O error-context.md
// do Playwright carrega a URL e o snapshot da página; por isso PLAYWRIGHT_NO_COPY_PROMPT=1 o desliga.
// Reporter 'line', sem html nem anexos. O script confere o vazamento na saída antes de apagá-la.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';

export default defineConfig({
  testDir: './tests/e2e-ar',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['line']],
  outputDir: process.env.E2E_AR_SAIDA ?? '/var/tmp/v17-e2e-ar/saida',
  use: {
    trace: 'off',
    video: 'off',
    screenshot: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath:
            process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/lib64/chromium-browser/chromium-browser'
        }
      }
    }
  ]
});
