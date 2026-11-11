import AxeBuilder from '@axe-core/playwright';
import {
  devices,
  expect,
  test,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page
} from '@playwright/test';
import { definirRoteiroSmtp, resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp, esperarApp, esperarEntrada } from './apoio/acoes';
import { CONTA_ADMIN, ORIGEM, REMETENTE_DO_SITE } from './apoio/constantes';
import {
  caminhoDoLinkNoCorpo,
  conversasDesde,
  corpoSemLink,
  esperarEmail,
  marcarCapturas,
  semEmailCompleto,
  type EmailCapturado
} from './apoio/emailsCapturados';

/**
 * CV-F1 e EM-F1 (plano da sessão única, seções 7.1.7 e 8, e as OS CV-F1 e EM-F1): o link de convite e o e-mail
 * da conta no painel de administração.
 *
 * Dois contextos do navegador. O admin sintético está no painel; o segundo contexto é a pessoa que recebe o
 * link. As contas são sintéticas e criadas pelo próprio teste (T25), com e-mail `@example.com`.
 *
 * O servidor manda e-mail de verdade pelo cliente SMTP, mas aqui o destino é o SMTP falso (apoio/smtpRepasse.ts,
 * em 127.0.0.1): nenhuma mensagem sai da máquina. O link que a pessoa abre é lido do e-mail capturado, e o do
 * painel só é comparado com ele. O e-mail traz o endereço de produção do site; o teste NUNCA navega até ele:
 * abre só o caminho e a query, na origem do teste.
 *
 * O token do convite nunca vai a log: o link só é comparado por resultado booleano, e as falhas de navegação e
 * de axe são reescritas sem o endereço.
 */

const LOGIN_CONVIDADO = 'convidado-sintetico';
const SENHA_PRIMEIRA = 'senha-do-convite-um-123';
const SENHA_SEGUNDA = 'senha-do-convite-dois-456';
/** Também com 15 caracteres ou mais: o `minlength` do navegador barraria uma curta antes de ela chegar ao servidor. */
const SENHA_REPETICAO_ERRADA = 'senha-do-convite-outra-789';
const REPETICAO_NAO_CONFERE = 'A repetição não confere com a senha nova.';

const FORMA_DO_LINK = new RegExp(`^${ORIGEM}/api/convite\\.php\\?t=[0-9a-f]{64}$`);

/** Textos do líder (R8, 7.5 do plano), verbatim. */
const M2 = 'Este link já foi usado. Se não foi você, avise quem administra o site.';
const M3 = 'Este link não vale. Peça um novo a quem administra o site.';
const TITULO_REDEFINIR = `Link para nova senha de ${LOGIN_CONVIDADO}:`;
const TEXTO_VALIDADE =
  'Ele só aparece agora, vale por 48 horas e uma vez só. Envie por um canal privado.';
const TITULO_CRIAR = `Link de primeiro acesso de ${LOGIN_CONVIDADO}:`;

/** E-mail do convidado como o admin o digita (com maiúsculas) e como o servidor o grava e o usa (minúsculas). */
const EMAIL_DIGITADO = 'Convidado-Sintetico@Example.COM';
const EMAIL_CONVIDADO = `${LOGIN_CONVIDADO}@example.com`;
const FRASE_ENVIADO = `O link também foi para ${EMAIL_CONVIDADO}.`;
const FRASE_FALHA = 'O e-mail não saiu. Copie o link e envie por outro canal.';
const E_MAIL_INVALIDO = 'E-mail inválido.';
const E_MAIL_EM_USO = 'Este e-mail já está em outra conta.';
const SENHA_ATUAL_NAO_CONFERE = 'A senha atual não confere.';
const SENHA_ATUAL_EXIGIDA = 'Informe a senha atual para trocar o seu e-mail.';

/**
 * Textos dos e-mails E1 a E4 e da tela do "Esqueci a senha" (R14, ratificados pelo líder em 09/11/2026: "Usar
 * como estão"; plano da sessão única, 8.1.9), verbatim. `<link>` marca o lugar do endereço, sozinho na linha.
 */
const E1_ASSUNTO = 'Crie a sua senha de acesso';
const e1Corpo = (login: string): string =>
  [
    'Olá.',
    '',
    `Foi criado um acesso para você, com o usuário ${login}.`,
    '',
    'Para criar a sua senha, abra o link abaixo. Ele vale por 48 horas e só pode ser usado uma vez.',
    '<link>',
    '',
    'Se você não esperava esta mensagem, pode ignorá-la.',
    '',
    'Seu e-mail fica guardado só para enviar links de acesso como este e é apagado quando a conta é excluída. Esta caixa não recebe respostas.'
  ].join('\n');
const E2_ASSUNTO = 'Link para criar uma senha nova';
const e2Corpo = (login: string): string =>
  [
    'Olá.',
    '',
    `Pediram uma senha nova para o usuário ${login}.`,
    '',
    'Para criar a senha nova, abra o link abaixo. Ele vale por 24 horas e só pode ser usado uma vez. Até lá, a senha atual continua valendo.',
    '<link>',
    '',
    'Se não foi você, ignore esta mensagem: nada muda na sua conta. Esta caixa não recebe respostas.'
  ].join('\n');
const E3_ASSUNTO = 'Sua senha foi redefinida';
const e3Corpo = (login: string): string =>
  [
    'Olá.',
    '',
    `Quem administra o site redefiniu a senha do usuário ${login}. A senha antiga parou de valer.`,
    '',
    'Para criar a senha nova, abra o link abaixo. Ele vale por 48 horas e só pode ser usado uma vez.',
    '<link>',
    '',
    'Esta caixa não recebe respostas.'
  ].join('\n');
const E4_ASSUNTO = 'Sua senha foi criada';
const e4Corpo = (login: string): string =>
  [
    'Olá.',
    '',
    `A senha do usuário ${login} acabou de ser criada pelo link enviado a este e-mail.`,
    '',
    'Se não foi você, avise quem administra o site. Esta caixa não recebe respostas.'
  ].join('\n');
const FRASE_UNICA_DO_ESQUECI =
  'Se houver uma conta com esse usuário ou e-mail, o link para criar a senha nova chega ao e-mail dela em alguns minutos. Confira também a pasta de spam.';

const VIEWPORT_360 = { largura: 360, altura: 740 } as const;
const VIEWPORT_1280 = { largura: 1280, altura: 800 } as const;
const AMBOS_OS_VIEWPORTS = [VIEWPORT_360, VIEWPORT_1280] as const;
const TEMAS = ['light', 'dark'] as const;

test.beforeEach(() => resetarPrivado());

/** Abre o link sem deixar o token em mensagem de erro (o Playwright cita a URL ao falhar). */
async function abrirLink(page: Page, link: string): Promise<void> {
  try {
    await page.goto(link);
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new Error(`não abriu o link do convite: ${motivo.split(link).join('<link>')}`);
  }
}

/**
 * Axe sem o HTML dos nós (o nó do link do painel leva o token no texto). `escopo` restringe a análise a um
 * seletor: no painel, só a seção da administração. A casca do app (aviso legal e botão da página inicial,
 * fora de marco de página) tem a violação `region` já existente e não é desta fatia; vai à PENDÊNCIA.
 */
async function violacoesDoAxe(page: Page, escopo?: string): Promise<unknown[]> {
  const analise = new AxeBuilder({ page });
  const resultado = await (escopo ? analise.include(escopo) : analise).analyze();
  return resultado.violations.map((v) => ({ id: v.id, alvos: v.nodes.map((n) => n.target) }));
}

/**
 * Cria a conta pela API, de dentro do contexto do admin. Devolve só o caminho do convite
 * (o token fica na variável do teste) e a resposta em forma booleana.
 */
async function criarContaPelaApi(
  page: Page,
  usuario: string = LOGIN_CONVIDADO
): Promise<{ status: number; caminho: string }> {
  return page.evaluate(
    async ({ usuario, email }) => {
      const sessao = (await (await fetch('/api/sessao.php')).json()) as { csrf: string };
      const resposta = await fetch('/api/usuarios.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': sessao.csrf
        },
        body: JSON.stringify({ acao: 'criar', usuario, email })
      });
      const corpo = (await resposta.json()) as { convite?: string };
      return { status: resposta.status, caminho: corpo.convite ?? '' };
    },
    { usuario, email: `${usuario}@example.com` }
  );
}

/** Quantas contas a lista ganha antes da conta de teste, para o bloco do link nascer fora da janela. */
const CONTAS_EXTRAS = 6;

/** Contas sintéticas criadas pelo próprio teste, pela mesma API: a conta de teste vira a última linha da lista. */
async function criarContasExtras(page: Page): Promise<void> {
  for (let n = 1; n <= CONTAS_EXTRAS; n += 1) {
    const resposta = await criarContaPelaApi(page, `extra-sintetica-${n}`);
    expect(resposta.status, `criar a conta extra ${n} pela API`).toBe(200);
  }
}

/** Cria a conta pelo formulário "Novo usuário" do painel, como o admin faria. */
async function criarPeloFormulario(page: Page, usuario: string, email: string): Promise<void> {
  await page.locator('input[name="novoUsuario"]').fill(usuario);
  await page.locator('input[name="novoEmail"]').fill(email);
  await page.getByRole('button', { name: 'Criar usuário' }).click();
}

/**
 * O e-mail capturado e o link que ele traz, já na origem do teste: o endereço de produção do e-mail nunca é
 * aberto, só o caminho e a query. Falha sem imprimir o corpo (ele leva o link).
 */
async function linkDoEmail(
  antes: ReadonlySet<string>,
  filtro: { para: string; assunto: string }
): Promise<{ email: EmailCapturado; link: string }> {
  const email = await esperarEmail(antes, filtro);
  const caminho = caminhoDoLinkNoCorpo(email.corpo);
  expect(
    caminho !== undefined,
    'o corpo do e-mail traz o link, sozinho na linha, com a origem do site em produção'
  ).toBe(true);
  return { email, link: `${ORIGEM}${caminho!}` };
}

/** O e-mail confere com o texto do líder, byte a byte, e sai do remetente fixo para o endereço certo. */
function exigirEmailIgualAoDoLider(
  email: EmailCapturado,
  esperado: { para: string; assunto: string; corpo: string }
): void {
  expect(email.remetente, 'remetente do e-mail').toBe(REMETENTE_DO_SITE);
  expect(email.destinatario, 'destinatário do e-mail').toBe(esperado.para);
  expect(email.assunto, 'assunto do e-mail').toBe(esperado.assunto);
  expect(email.codificacao, 'e-mail só texto, em quoted-printable').toBe('quoted-printable');
  expect(corpoSemLink(email.corpo), 'corpo do e-mail').toBe(esperado.corpo);
}

/**
 * Limite de cima da área livre: a borda de baixo do cabeçalho quando ele é fixo e, quando o fio dourado de
 * progresso de leitura aparece, a borda de baixo dele (o fio e a onda do cabeçalho penduram abaixo da faixa
 * e não capturam clique, então `elementFromPoint` não os enxerga: a geometria é que os conta).
 */
async function limiteDeCima(page: Page): Promise<number> {
  return page.evaluate(() => {
    const cabecalho = document.querySelector<HTMLElement>('.barra-topo');
    const trilho = document.querySelector<HTMLElement>('.barra-topo__progresso-trilho');
    let limite = 0;
    if (cabecalho && getComputedStyle(cabecalho).position === 'fixed') {
      limite = cabecalho.getBoundingClientRect().bottom;
    }
    if (trilho && getComputedStyle(trilho).display !== 'none') {
      limite = Math.max(limite, trilho.getBoundingClientRect().bottom);
    }
    return limite;
  });
}

/**
 * Espera a rolagem da página assentar: a mesma posição em várias leituras seguidas. Sem isto, uma leitura feita
 * antes de o painel rolar (ou durante) poderia dar o verde que a posição final não dá.
 */
async function esperarRolagemAssentar(page: Page): Promise<void> {
  let anterior = Number.NaN;
  let iguais = 0;
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => window.scrollY);
        iguais = y === anterior ? iguais + 1 : 0;
        anterior = y;
        return iguais;
      },
      { intervals: [100], message: 'a rolagem da página assenta' }
    )
    .toBeGreaterThanOrEqual(4);
}

/**
 * O bloco do link aparece com o foco e o TOPO dele (o título e o começo do link) na área livre, abaixo do cabeçalho
 * fixo e do fio de progresso (o título começa abaixo do limite, não só a caixa do bloco), SEM o teste rolar nada:
 * quem leva o bloco para a vista é o próprio painel. O bloco inteiro pode ser mais alto que a área livre (a letra
 * segue a escala do site); o resto se alcança rolando.
 * Sem isso, com a conta numa linha baixa da lista, o link (que aparece uma vez) nasceria fora da janela e a pessoa
 * não o veria (F-2 da revisão). Tolerância de 1 px: o navegador alinha em subpixel.
 */
async function esperarTopoDoBlocoNaAreaLivreComFoco(page: Page): Promise<void> {
  const bloco = page.locator('.ar-admin__convite');
  await expect(bloco).toBeFocused();
  await esperarRolagemAssentar(page);
  await expect
    .poll(
      async () => {
        const limite = await limiteDeCima(page);
        return bloco.evaluate((el, limiteDeCima) => {
          const r = el.getBoundingClientRect();
          // O título é a primeira linha de texto do bloco: é ele que o fio dourado cruzaria (V-1 da revisão).
          const titulo = el.querySelector('p')!.getBoundingClientRect();
          return (
            titulo.top >= limiteDeCima - 1 &&
            r.top < document.documentElement.clientHeight &&
            r.left >= 0 &&
            r.right <= document.documentElement.clientWidth
          );
        }, limite);
      },
      {
        message:
          'o topo do bloco do link está abaixo do cabeçalho e dentro da janela, sem o teste rolar'
      }
    )
    .toBe(true);
}

/**
 * Nada fixo da página cobre o elemento: o centro, o meio de cada lado (recuado dos cantos arredondados), os
 * pontos de cima e de baixo e os quatro cantos (recuados do arredondamento) devolvem o próprio elemento ou algo
 * dentro dele em `elementFromPoint`. Fora da janela, `elementFromPoint` devolve null e a checagem falha.
 */
async function livreDeElementoFixo(alvo: Locator): Promise<boolean> {
  return alvo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const meioX = r.left + r.width / 2;
    const meioY = r.top + r.height / 2;
    // Recuo dos cantos: metade do raio do arredondamento (botão em pílula inclusive), no máximo a metade do lado.
    const raio = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const recuo = Math.max(3, Math.min(raio / 2, r.width / 2 - 1, r.height / 2 - 1));
    const pontos: [number, number][] = [
      [meioX, meioY],
      [r.left + 10, meioY],
      [r.right - 10, meioY],
      [meioX, r.top + 3],
      [meioX, r.bottom - 3],
      [r.left + recuo, r.top + recuo],
      [r.right - recuo, r.top + recuo],
      [r.left + recuo, r.bottom - recuo],
      [r.right - recuo, r.bottom - recuo]
    ];
    return pontos.every(([x, y]) => {
      const topo = document.elementFromPoint(x, y);
      return topo !== null && el.contains(topo);
    });
  });
}

/**
 * Rola até o elemento com a rolagem nativa (`nearest`, que respeita o scroll-padding do layout) e confere que
 * nada fixo o cobre: a pilha fixa da base (cartão de contagem e botão Home) fica fora da área alcançada.
 */
async function conferirAlcancavelPorRolagem(alvo: Locator, descricao: string): Promise<void> {
  await alvo.evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
  await expect
    .poll(() => livreDeElementoFixo(alvo), {
      message: `nada fixo cobre ${descricao} depois de rolar até ele`
    })
    .toBe(true);
}

async function conferirBotaoAlcancavelPorRolagem(page: Page, nome: string): Promise<void> {
  await conferirAlcancavelPorRolagem(page.getByRole('button', { name: nome }), `o botão ${nome}`);
}

/** O foco do teclado chega a cada botão pelo Tab, a partir do bloco, e a rolagem nativa o deixa sem nada por cima. */
async function conferirBotoesPeloTeclado(page: Page): Promise<void> {
  await page.locator('.ar-admin__convite').focus();
  for (const nome of ['Copiar link', 'Já enviei']) {
    await page.keyboard.press('Tab');
    const botao = page.getByRole('button', { name: nome });
    await expect(botao).toBeFocused();
    await expect
      .poll(() => livreDeElementoFixo(botao), {
        message: `nada fixo cobre o botão ${nome} depois do Tab`
      })
      .toBe(true);
  }
}

/** Tamanho da letra, em px computados, do que o bloco mostra, e o do corpo do próprio painel naquele modo. */
async function tamanhosDeLetra(
  page: Page
): Promise<{ link: number; paragrafos: number[]; corpoDoPainel: number }> {
  return page.evaluate(() => {
    const px = (el: HTMLElement | null): number =>
      el ? parseFloat(getComputedStyle(el).fontSize) : Number.NaN;
    const bloco = document.querySelector('.ar-admin__convite')!;
    return {
      link: px(bloco.querySelector('.ar-admin__link')),
      paragrafos: Array.from(bloco.querySelectorAll('p')).map(px),
      corpoDoPainel: px(document.querySelector('.ar-admin'))
    };
  });
}

/**
 * Campo `autenticado` de /api/sessao.php com os cookies do contexto. Vai pela API do contexto, e não por `fetch`
 * dentro da página: a tela de entrada tem CSP `default-src 'none'`, que bloqueia qualquer `fetch`.
 */
async function sessaoAutenticada(contexto: BrowserContext): Promise<boolean | undefined> {
  const resposta = await contexto.request.get('/api/sessao.php', {
    headers: { Accept: 'application/json' }
  });
  let corpo: { autenticado?: boolean };
  try {
    corpo = (await resposta.json()) as { autenticado?: boolean };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new Error(
      `o corpo de /api/sessao.php (status ${resposta.status()}) não é JSON: ${motivo}`
    );
  }
  return corpo.autenticado;
}

/** Fim do prazo do convite como o painel deve mostrar, calculado a partir do epoch que a API devolve. */
async function prazoEsperadoPelaApi(page: Page): Promise<string> {
  return page.evaluate(async (usuario) => {
    const resposta = await fetch('/api/usuarios.php', { cache: 'no-store' });
    const corpo = (await resposta.json()) as {
      usuarios: { usuario: string; convite: string | null; conviteExpiraEm: number | null }[];
    };
    const conta = corpo.usuarios.find((u) => u.usuario === usuario);
    if (!conta || conta.convite !== 'pendente' || typeof conta.conviteExpiraEm !== 'number') {
      throw new Error('a API não lista o convite pendente da conta de teste');
    }
    const d = new Date(conta.conviteExpiraEm * 1000);
    const dois = (n: number): string => String(n).padStart(2, '0');
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }, LOGIN_CONVIDADO);
}

function linhaDaConta(page: Page): Locator {
  return page.locator('tbody tr', { hasText: LOGIN_CONVIDADO });
}

/** Clica Redefinir na linha da conta de teste e devolve o link que o painel mostrou. */
async function redefinirELerLink(page: Page): Promise<string> {
  await page.locator(`button[data-acao="redefinir"][data-usuario="${LOGIN_CONVIDADO}"]`).click();
  await expect(page.getByText(TITULO_REDEFINIR, { exact: true })).toBeVisible();
  const link = (await page.locator('.ar-admin__link').textContent()) ?? '';
  expect(FORMA_DO_LINK.test(link), 'forma do link mostrado no painel').toBe(true);
  return link;
}

async function novaPessoa(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ ...devices['Desktop Chrome'], baseURL: ORIGEM });
}

/** A mensagem do convite: texto exato em role="alert", repetido no título, nenhum formulário e nenhum byte do app. */
async function esperarMensagem(page: Page, texto: string): Promise<void> {
  await expect(page.getByRole('alert')).toHaveText(texto);
  await expect(page).toHaveTitle(texto);
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('#app')).toHaveCount(0);
}

/** Só o formulário do convite: sem o app, com o usuário somente leitura. */
async function esperarFormularioDoConvite(page: Page): Promise<void> {
  await expect(page.locator('#senhaNova')).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);
  await expect(page.locator('input[name="usuario"]')).toHaveValue(LOGIN_CONVIDADO);
  await expect(page.locator('input[name="usuario"]')).toHaveAttribute('readonly', '');
}

/** O que o navegador mandou no POST do formulário do convite, lido de todos os cabeçalhos do pedido. */
interface PostDoConvite {
  readonly status: number;
  readonly origin: string | undefined;
  readonly secFetchSite: string | undefined;
}

/** Preenche as duas senhas, envia o formulário e devolve o POST como o navegador o fez e a resposta que ele teve. */
async function enviarFormulario(
  page: Page,
  senhaNova: string,
  repeticao: string
): Promise<PostDoConvite> {
  await page.locator('#senhaNova').fill(senhaNova);
  await page.locator('#senhaRepetida').fill(repeticao);
  const [resposta] = await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/convite.php'
    ),
    page.getByRole('button', { name: 'Criar senha e entrar' }).click()
  ]);
  const cabecalhos = await resposta.request().allHeaders();
  return {
    status: resposta.status(),
    origin: cabecalhos['origin'],
    secFetchSite: cabecalhos['sec-fetch-site']
  };
}

/**
 * E1: o POST do formulário leva o Origin verdadeiro do site e vem de dentro do próprio site. Com a política
 * de referrer que omite o Referer, o navegador manda `Origin: null` e o servidor recusa com 403.
 */
function exigirPostComOrigemPropria(
  post: PostDoConvite,
  statusEsperado: number,
  etapa: string
): void {
  expect(post.origin, `E1, ${etapa}: Origin do POST do formulário do convite`).toBe(ORIGEM);
  expect(post.secFetchSite, `E1, ${etapa}: Sec-Fetch-Site do POST`).toBe('same-origin');
  expect(post.status, `E1, ${etapa}: status da resposta ao POST`).toBe(statusEsperado);
}

/** Senha criada pelo link: o POST cumpre E1 (303) e só depois a pessoa chega ao app. */
async function criarSenhaPeloConvite(page: Page, senha: string, etapa: string): Promise<void> {
  const post = await enviarFormulario(page, senha, senha);
  exigirPostComOrigemPropria(post, 303, etapa);
  await esperarApp(page);
}

/** Pedido feito por um contexto, reduzido ao que E1 e E2 comparam. O Referer fica na memória: nunca vai a mensagem. */
interface PedidoVisto {
  readonly metodo: string;
  readonly caminho: string;
  readonly referer: string | undefined;
  readonly cabecalhosLidos: boolean;
}

/** Grava todo pedido do contexto (documentos, CSS, ícone, fontes, POST, app) com os cabeçalhos completos. */
function gravarPedidos(contexto: BrowserContext): { vistos: () => Promise<PedidoVisto[]> } {
  const pendentes: Promise<PedidoVisto>[] = [];
  contexto.on('request', (pedido) => {
    pendentes.push(
      pedido.allHeaders().then(
        (cabecalhos) => ({
          metodo: pedido.method(),
          caminho: new URL(pedido.url()).pathname,
          referer: cabecalhos['referer'],
          cabecalhosLidos: true
        }),
        () => ({
          metodo: pedido.method(),
          caminho: new URL(pedido.url()).pathname,
          referer: undefined,
          cabecalhosLidos: false
        })
      )
    );
  });
  return { vistos: () => Promise.all(pendentes) };
}

/**
 * E2: nenhum Referer do contexto da pessoa leva o token do convite nem o trecho `/api/convite.php?`. No pedido
 * de `entrada.css` e no POST ele é a origem seguida de `/` (política strict-origin). Tudo por booleano: o valor
 * do Referer nunca é impresso. "Sem `?`" não serve: o Referer das fontes é `entrada.css?v=...`, e isso é legítimo.
 */
function exigirRefererSemToken(pedidos: readonly PedidoVisto[], link: string): void {
  const token = /[?&]t=([0-9a-f]{64})/.exec(link)?.[1] ?? '';
  expect(token.length, 'E2: o token foi extraído do link').toBe(64);
  expect(
    pedidos.filter((p) => !p.cabecalhosLidos).length,
    'E2: pedidos cujos cabeçalhos não puderam ser lidos'
  ).toBe(0);
  const comReferer = pedidos.filter((p) => p.referer !== undefined);
  expect(comReferer.length, 'E2: há pedidos com Referer para examinar').toBeGreaterThan(0);
  const vazaram = comReferer.filter(
    (p) => (p.referer ?? '').includes(token) || (p.referer ?? '').includes('/api/convite.php?')
  );
  expect(vazaram.length, 'E2: pedidos com Referer que leva o token ou o endereço do convite').toBe(
    0
  );
  const css = pedidos.filter((p) => p.caminho === '/entrada.css');
  const posts = pedidos.filter((p) => p.metodo === 'POST' && p.caminho === '/api/convite.php');
  expect(css.length, 'E2: a página do convite pediu entrada.css').toBeGreaterThan(0);
  expect(posts.length, 'E2: o formulário do convite foi enviado').toBeGreaterThan(0);
  const semOrigemComBarra = [...css, ...posts].filter((p) => p.referer !== `${ORIGEM}/`);
  expect(
    semOrigemComBarra.length,
    'E2: entrada.css e POST com Referer igual à origem seguida de /'
  ).toBe(0);
}

/** Capturas a 360 e 1280 nos dois temas, mais o axe de cada combinação. Sem rolagem lateral a 360. */
async function capturarEAnalisar(
  page: Page,
  prefixo: string,
  projeto: string,
  viewports: readonly { largura: number; altura: number }[],
  escopoDoAxe?: string,
  fatia = 'cv-f1'
): Promise<void> {
  const fundos = new Set<string>();
  for (const tema of TEMAS) {
    await page.emulateMedia({ colorScheme: tema });
    for (const { largura, altura } of viewports) {
      await page.setViewportSize({ width: largura, height: altura });
      const semRolagemHorizontal = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      );
      expect(
        semRolagemHorizontal,
        `${prefixo}: rolagem horizontal a ${largura} px, tema ${tema}`
      ).toBe(true);
      await capturar(page, `${fatia}-${projeto}-${prefixo}-${largura}-${tema}`);
    }
    fundos.add(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    expect(await violacoesDoAxe(page, escopoDoAxe), `${prefixo}: axe no tema ${tema}`).toEqual([]);
  }
  // O tema emulado chegou de fato: os dois temas têm fundo diferente.
  expect(fundos.size, `${prefixo}: o tema escuro difere do claro`).toBe(2);
}

test('convite: o admin cria a conta pelo painel com e-mail, o link vem no e-mail, a pessoa cria a senha e entra; redefinir derruba a sessão sem aviso', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(240_000);
  const projeto = testInfo.project.name;
  const capturas = marcarCapturas();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGEM });
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  await criarContasExtras(page);
  await page.reload();
  await esperarApp(page);

  // 1. O admin cria a conta pelo formulário, com o e-mail em maiúsculas: o painel mostra o título, o link e a
  //    frase de enviado, com o e-mail como o servidor o grava.
  await criarPeloFormulario(page, LOGIN_CONVIDADO, EMAIL_DIGITADO);
  await expect(page.getByText(TITULO_CRIAR, { exact: true })).toBeVisible();
  await esperarTopoDoBlocoNaAreaLivreComFoco(page);
  await expect(page.getByText(FRASE_ENVIADO, { exact: true })).toBeVisible();
  const linkNoPainel = (await page.locator('.ar-admin__link').textContent()) ?? '';
  expect(FORMA_DO_LINK.test(linkNoPainel), 'forma do link do criar mostrado no painel').toBe(true);

  // 2. O E1 chegou ao SMTP falso: texto do líder, remetente fixo, endereço em minúsculas, o mesmo link do painel.
  const e1 = await linkDoEmail(capturas, { para: EMAIL_CONVIDADO, assunto: E1_ASSUNTO });
  exigirEmailIgualAoDoLider(e1.email, {
    para: EMAIL_CONVIDADO,
    assunto: E1_ASSUNTO,
    corpo: e1Corpo(LOGIN_CONVIDADO)
  });
  expect(e1.link === linkNoPainel, 'o link do e-mail é o mesmo do painel').toBe(true);
  const linkDoCriar = e1.link;

  // 3. Capturas e axe do painel com o link e a frase; "Já enviei" devolve o foco ao campo Usuário do formulário.
  await capturarEAnalisar(
    page,
    'painel-criou-com-email',
    projeto,
    [VIEWPORT_1280],
    '.ar-admin',
    'em-f1'
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: 'Já enviei' }).click();
  await expect(page.locator('.ar-admin__convite')).toHaveCount(0);
  await expect(page.locator('input[name="novoUsuario"]')).toBeFocused();
  await expect(page.locator('input[name="novoUsuario"]')).toHaveValue('');
  await expect(page.locator('input[name="novoEmail"]')).toHaveValue('');

  // 4. A conta nasce com convite pendente (o painel mostra o prazo lido do epoch em segundos) e com e-mail na
  //    coluna E-mail; a conta do admin, que o semeador criou sem e-mail, diz "Sem e-mail".
  const prazo = await prazoEsperadoPelaApi(page);
  await page.reload();
  await esperarApp(page);
  const estadoDaConta = linhaDaConta(page).locator('td[data-rotulo="Estado"]');
  await expect(estadoDaConta).toContainText(`Convite pendente até ${prazo}`);
  await expect(estadoDaConta).not.toContainText('Sem e-mail');
  await expect(linhaDaConta(page).locator('td[data-rotulo="E-mail"]')).toHaveText(EMAIL_CONVIDADO);
  await expect(
    page.locator('tbody tr', { hasText: CONTA_ADMIN.usuario }).locator('td[data-rotulo="Estado"]')
  ).toContainText('Sem e-mail');

  // 5. Redefinir mostra o link, composto com a origem do navegador, uma vez, com os textos do líder, e manda o
  //    E3 com o mesmo link.
  const antesDoRedefinir = marcarCapturas();
  const linkDoPainel = await redefinirELerLink(page);
  await esperarTopoDoBlocoNaAreaLivreComFoco(page);
  expect(linkDoPainel === linkDoCriar, 'o link do Redefinir é outro, não o do criar').toBe(false);
  await expect(page.getByText(TEXTO_VALIDADE, { exact: true })).toBeVisible();
  await expect(page.getByText(FRASE_ENVIADO, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copiar link' })).toBeVisible();
  const e3 = await linkDoEmail(antesDoRedefinir, { para: EMAIL_CONVIDADO, assunto: E3_ASSUNTO });
  exigirEmailIgualAoDoLider(e3.email, {
    para: EMAIL_CONVIDADO,
    assunto: E3_ASSUNTO,
    corpo: e3Corpo(LOGIN_CONVIDADO)
  });
  expect(e3.link === linkDoPainel, 'o link do e-mail do Redefinir é o do painel').toBe(true);
  const link = e3.link;

  // 6. Copiar link entrega o endereço completo à área de transferência.
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByText('Link copiado.', { exact: true })).toBeVisible();
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado === link, 'a área de transferência tem o link inteiro').toBe(true);

  // 7. Capturas, axe e rolagem lateral com o link na tela (o link tem cerca de 100 caracteres).
  await capturarEAnalisar(page, 'painel-com-link', projeto, [VIEWPORT_1280], '.ar-admin');
  await page.emulateMedia({ colorScheme: 'light' });

  // 8. Já enviei apaga o link da tela.
  await page.getByRole('button', { name: 'Já enviei' }).click();
  await expect(page.locator('.ar-admin__convite')).toHaveCount(0);
  await expect(page.locator('.ar-admin__link')).toHaveCount(0);

  // 9. A pessoa abre o link do criar (já trocado por este Redefinir): M3. O link novo mostra só o formulário.
  const pessoa = await novaPessoa(browser);
  const pedidosDaPessoa = gravarPedidos(pessoa);
  try {
    const aparelho = await pessoa.newPage();
    await abrirLink(aparelho, linkDoCriar);
    await esperarMensagem(aparelho, M3);

    // E2 olha os pedidos da pessoa desde a abertura deste link até chegar ao app.
    const pedidosAntesDoLink = (await pedidosDaPessoa.vistos()).length;
    await abrirLink(aparelho, link);
    await esperarFormularioDoConvite(aparelho);
    await capturarEAnalisar(aparelho, 'pagina-do-convite', projeto, AMBOS_OS_VIEWPORTS);
    await aparelho.setViewportSize({ width: 1280, height: 800 });
    await aparelho.emulateMedia({ colorScheme: 'light' });

    // 10. E3: a repetição diferente mostra a mensagem e o link segue valendo; E1 vale nos dois POSTs.
    const posErro = await enviarFormulario(aparelho, SENHA_PRIMEIRA, SENHA_REPETICAO_ERRADA);
    exigirPostComOrigemPropria(posErro, 400, 'E3, 1º POST com a repetição errada');
    await expect(aparelho.getByRole('alert')).toHaveText(REPETICAO_NAO_CONFERE);
    await esperarFormularioDoConvite(aparelho);

    // 11. Cria a senha e já está dentro do site (E1 no 2º POST, antes de esperar o app), e o E4 avisa o e-mail.
    const antesDaSenha = marcarCapturas();
    await criarSenhaPeloConvite(aparelho, SENHA_PRIMEIRA, 'E3, 2º POST depois do erro');
    expect(await sessaoAutenticada(pessoa), 'sessão aberta pelo convite').toBe(true);
    exigirRefererSemToken((await pedidosDaPessoa.vistos()).slice(pedidosAntesDoLink), link);
    exigirEmailIgualAoDoLider(
      await esperarEmail(antesDaSenha, { para: EMAIL_CONVIDADO, assunto: E4_ASSUNTO }),
      { para: EMAIL_CONVIDADO, assunto: E4_ASSUNTO, corpo: e4Corpo(LOGIN_CONVIDADO) }
    );

    // 12. O mesmo link de novo: M2, sem formulário.
    await abrirLink(aparelho, link);
    await esperarMensagem(aparelho, M2);
    await aparelho.goto('/');
    await esperarApp(aparelho);
    expect(await sessaoAutenticada(pessoa), 'sessão ainda aberta antes do Redefinir').toBe(true);

    // 13. O admin recarrega: o convite consumido sumiu da coluna Estado. Redefine outra vez, e o E3 novo traz o
    //     mesmo link que o painel mostra.
    await page.reload();
    await esperarApp(page);
    await expect(linhaDaConta(page).locator('td[data-rotulo="Estado"]')).not.toContainText(
      'Convite'
    );
    const antesDoSegundo = marcarCapturas();
    const linkNovoNoPainel = await redefinirELerLink(page);
    const e3Novo = await linkDoEmail(antesDoSegundo, {
      para: EMAIL_CONVIDADO,
      assunto: E3_ASSUNTO
    });
    expect(e3Novo.link === linkNovoNoPainel, 'o 2º e-mail do Redefinir é o do painel').toBe(true);
    const linkNovo = e3Novo.link;
    expect(linkNovo === link, 'o Redefinir gerou outro link').toBe(false);

    // 14. O segundo contexto cai no gesto seguinte, sem o aviso de outro aparelho.
    await aparelho.reload();
    await esperarEntrada(aparelho);
    await expect(aparelho.getByRole('alert')).toHaveCount(0);
    expect(await sessaoAutenticada(pessoa), 'sessão derrubada pelo Redefinir').toBe(false);

    // 15. O link já usado virou M3 (o Redefinir apaga o registro do uso) e o novo funciona.
    await abrirLink(aparelho, link);
    await esperarMensagem(aparelho, M3);
    await abrirLink(aparelho, linkNovo);
    await esperarFormularioDoConvite(aparelho);
    await criarSenhaPeloConvite(aparelho, SENHA_SEGUNDA, 'link novo depois do Redefinir');
    expect(await sessaoAutenticada(pessoa), 'sessão aberta pelo link novo').toBe(true);
  } finally {
    await pessoa.close();
  }
});

test('convite: a 360 px o link do painel quebra a linha e a página não rola de lado', async ({
  page
}, testInfo) => {
  test.setTimeout(120_000);
  // O viewport estreito vale desde a entrada: o menu lateral do app vira gaveta ao carregar, não ao redimensionar.
  await page.setViewportSize({ width: VIEWPORT_360.largura, height: VIEWPORT_360.altura });
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  await criarContasExtras(page);
  await page.reload();
  await esperarApp(page);

  // A conta nasce pelo formulário, com o campo E-mail, a 360 px nos dois temas (EM-F1); o bloco do link que
  // aparece é o do criar, com a frase de enviado.
  await page.locator('input[name="novoUsuario"]').fill(LOGIN_CONVIDADO);
  await page.locator('input[name="novoEmail"]').fill(EMAIL_CONVIDADO);
  await conferirAlcancavelPorRolagem(
    page.locator('input[name="novoEmail"]'),
    'o campo E-mail do formulário'
  );
  await conferirBotaoAlcancavelPorRolagem(page, 'Criar usuário');
  await capturarEAnalisar(
    page,
    'painel-formulario-com-email',
    testInfo.project.name,
    [VIEWPORT_360],
    '.ar-admin',
    'em-f1'
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: 'Criar usuário' }).click();
  await expect(page.getByText(TITULO_CRIAR, { exact: true })).toBeVisible();
  await expect(page.getByText(FRASE_ENVIADO, { exact: true })).toBeVisible();
  const link = (await page.locator('.ar-admin__link').textContent()) ?? '';
  expect(FORMA_DO_LINK.test(link), 'forma do link do criar mostrado no painel').toBe(true);
  await esperarTopoDoBlocoNaAreaLivreComFoco(page);
  const medidas = await page.locator('.ar-admin__link').evaluate((el) => {
    const caixa = el.getBoundingClientRect();
    return {
      direita: caixa.right,
      janela: document.documentElement.clientWidth,
      linhas: Math.round(caixa.height / parseFloat(getComputedStyle(el).lineHeight))
    };
  });
  expect(medidas.direita, 'o link cabe na janela').toBeLessThanOrEqual(medidas.janela);
  expect(
    medidas.linhas,
    'o link de cerca de 100 caracteres quebra em várias linhas'
  ).toBeGreaterThan(1);
  expect(link.length, 'o link tem o comprimento de um convite').toBeGreaterThan(90);

  // F-1 da revisão: a 360 px o cartão fixo do calendário e o cabeçalho fixo não cobrem o título nem os botões.
  expect(
    await livreDeElementoFixo(page.locator('.ar-admin__convite p').first()),
    'nada fixo cobre o título do bloco do link'
  ).toBe(true);
  for (const nome of ['Copiar link', 'Já enviei']) {
    await conferirBotaoAlcancavelPorRolagem(page, nome);
  }
  // Uso real: copiar (sem a permissão da área de transferência neste contexto, a falha mostra a frase de cópia à
  // mão, a mais longa) aumenta o bloco, e os botões continuam alcançáveis acima do cartão fixo.
  await page.getByRole('button', { name: 'Copiar link' }).click();
  await expect(page.getByText(/^(Link copiado\.|Não foi possível copiar\.)/)).toBeVisible();
  for (const nome of ['Copiar link', 'Já enviei']) {
    await conferirBotaoAlcancavelPorRolagem(page, nome);
  }
  await capturarEAnalisar(
    page,
    'painel-com-link',
    testInfo.project.name,
    [VIEWPORT_360],
    '.ar-admin'
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: 'Já enviei' }).click();
  await expect(page.locator('input[name="novoUsuario"]')).toBeFocused();
});

/**
 * Letra e posição do bloco do link (terceira correção da CV-F1): a letra vem dos tokens de escala do site, em
 * cada largura e em cada modo (a Leitura ampliada é o modo de baixa visão e não pode ter o menor texto da tela
 * aqui); o topo do bloco fica na área livre quando ele recebe o foco, mesmo quando o bloco inteiro é mais alto
 * que a área; os botões se alcançam por rolagem e por Tab sem nada fixo por cima; e a página não rola de lado.
 * Só números e booleanos nas mensagens: o link nunca aparece em falha.
 */
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
const LETRA_MINIMA_NO_MODO_NORMAL_PX = 14;

for (const { largura, altura } of AMBOS_OS_VIEWPORTS) {
  for (const ampliada of [false, true]) {
    const modo = ampliada ? 'Leitura ampliada' : 'modo normal';
    test(`convite: o bloco do link a ${largura} px (${modo}) tem a letra da escala e o topo na área livre`, async ({
      page
    }, testInfo) => {
      test.setTimeout(120_000);
      if (ampliada) {
        await page.addInitScript(
          (chave) => localStorage.setItem(chave, 'true'),
          CHAVE_MODO_ADAPTADO
        );
      }
      await page.setViewportSize({ width: largura, height: altura });
      await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
      await criarContasExtras(page);
      const criada = await criarContaPelaApi(page);
      expect(criada.status, 'criar pela API').toBe(200);
      await page.reload();
      await esperarApp(page);
      if (ampliada) {
        await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
      }

      await redefinirELerLink(page);
      await esperarTopoDoBlocoNaAreaLivreComFoco(page);
      if (ampliada) {
        for (const tema of TEMAS) {
          await page.emulateMedia({ colorScheme: tema });
          await capturar(
            page,
            `cv-f1-${testInfo.project.name}-painel-com-link-ampliada-${largura}-${tema}`
          );
        }
      }

      const letra = await tamanhosDeLetra(page);
      const menorParagrafo = Math.min(...letra.paragrafos);
      const contexto = `a ${largura} px (${modo})`;
      if (!ampliada) {
        expect
          .soft(
            letra.link,
            `font-size do link ${contexto}, mínimo ${LETRA_MINIMA_NO_MODO_NORMAL_PX}`
          )
          .toBeGreaterThanOrEqual(LETRA_MINIMA_NO_MODO_NORMAL_PX);
        expect
          .soft(
            menorParagrafo,
            `menor font-size dos parágrafos ${contexto}, mínimo ${LETRA_MINIMA_NO_MODO_NORMAL_PX}`
          )
          .toBeGreaterThanOrEqual(LETRA_MINIMA_NO_MODO_NORMAL_PX);
      }
      expect
        .soft(
          letra.link,
          `font-size do link ${contexto} contra o corpo do painel (${letra.corpoDoPainel})`
        )
        .toBeGreaterThanOrEqual(letra.corpoDoPainel);
      expect
        .soft(
          menorParagrafo,
          `menor font-size dos parágrafos ${contexto} contra o corpo do painel (${letra.corpoDoPainel})`
        )
        .toBeGreaterThanOrEqual(letra.corpoDoPainel);

      expect
        .soft(
          await livreDeElementoFixo(page.locator('.ar-admin__convite p').first()),
          `nada fixo cobre o título do bloco ${contexto}`
        )
        .toBe(true);
      for (const nome of ['Copiar link', 'Já enviei']) {
        await conferirBotaoAlcancavelPorRolagem(page, nome);
      }
      await conferirBotoesPeloTeclado(page);
      const lateral = await page.evaluate(() => ({
        larguraDocumento: document.documentElement.scrollWidth,
        larguraJanela: document.documentElement.clientWidth
      }));
      expect
        .soft(lateral.larguraDocumento, `rolagem lateral da página ${contexto}`)
        .toBeLessThanOrEqual(lateral.larguraJanela);
    });
  }
}

/** Senha nova do "Esqueci a senha": 15 caracteres ou mais, sintética. */
const SENHA_DO_ESQUECI = 'senha-nova-do-esqueci-321';

test('convite: "Esqueci a senha" pela tela de entrada: o link vem por e-mail, a senha nova entra e o aviso de senha criada chega', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(240_000);
  const projeto = testInfo.project.name;
  const capturas = marcarCapturas();
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  const criada = await criarContaPelaApi(page);
  expect(criada.status, 'criar pela API').toBe(200);
  const e1 = await linkDoEmail(capturas, { para: EMAIL_CONVIDADO, assunto: E1_ASSUNTO });

  // A pessoa cria a primeira senha e vai embora: a conta passa a ter senha de verdade.
  const primeira = await novaPessoa(browser);
  try {
    const aparelho = await primeira.newPage();
    await abrirLink(aparelho, e1.link);
    await esperarFormularioDoConvite(aparelho);
    await criarSenhaPeloConvite(aparelho, SENHA_PRIMEIRA, 'primeira senha, antes do Esqueci');
  } finally {
    await primeira.close();
  }

  // Outro aparelho, sem sessão: a pessoa esqueceu a senha.
  const pessoa = await novaPessoa(browser);
  try {
    const aparelho = await pessoa.newPage();
    await aparelho.goto('/');
    await esperarEntrada(aparelho);
    await aparelho.getByRole('link', { name: 'Esqueci a senha' }).click();

    await expect(aparelho).toHaveTitle('Esqueci a senha');
    await expect(aparelho.getByRole('heading', { name: 'Esqueci a senha' })).toBeVisible();
    await expect(aparelho.getByLabel('Usuário ou e-mail')).toBeFocused();
    await expect(aparelho.locator('script')).toHaveCount(0);
    await expect(aparelho.locator('#app')).toHaveCount(0);
    await capturarEAnalisar(
      aparelho,
      'pagina-esqueci',
      projeto,
      AMBOS_OS_VIEWPORTS,
      undefined,
      'em-f1'
    );
    await aparelho.setViewportSize({ width: 1280, height: 800 });
    await aparelho.emulateMedia({ colorScheme: 'light' });

    const antesDoPedido = marcarCapturas();
    await aparelho.getByLabel('Usuário ou e-mail').fill(LOGIN_CONVIDADO);
    await aparelho.getByRole('button', { name: 'Enviar link' }).click();
    await expect(aparelho.getByRole('alert')).toHaveText(FRASE_UNICA_DO_ESQUECI);
    await expect(aparelho).toHaveTitle(FRASE_UNICA_DO_ESQUECI);
    await capturarEAnalisar(
      aparelho,
      'pagina-esqueci-enviado',
      projeto,
      AMBOS_OS_VIEWPORTS,
      undefined,
      'em-f1'
    );
    await aparelho.setViewportSize({ width: 1280, height: 800 });
    await aparelho.emulateMedia({ colorScheme: 'light' });

    // O E2 chegou ao e-mail da conta, com o texto do líder, e o link é outro, que abre a tela de senha nova.
    const e2 = await linkDoEmail(antesDoPedido, { para: EMAIL_CONVIDADO, assunto: E2_ASSUNTO });
    exigirEmailIgualAoDoLider(e2.email, {
      para: EMAIL_CONVIDADO,
      assunto: E2_ASSUNTO,
      corpo: e2Corpo(LOGIN_CONVIDADO)
    });
    expect(e2.link === e1.link, 'o E2 traz um link novo, não o do convite').toBe(false);

    await abrirLink(aparelho, e2.link);
    await esperarFormularioDoConvite(aparelho);
    const antesDaNova = marcarCapturas();
    await criarSenhaPeloConvite(aparelho, SENHA_DO_ESQUECI, 'senha nova pelo Esqueci');
    expect(await sessaoAutenticada(pessoa), 'sessão aberta pelo link do E2').toBe(true);
    exigirEmailIgualAoDoLider(
      await esperarEmail(antesDaNova, { para: EMAIL_CONVIDADO, assunto: E4_ASSUNTO }),
      { para: EMAIL_CONVIDADO, assunto: E4_ASSUNTO, corpo: e4Corpo(LOGIN_CONVIDADO) }
    );
  } finally {
    await pessoa.close();
  }
});

test('convite: quando o e-mail não sai o painel diz e mostra o link; e-mail repetido e e-mail inválido são recusados', async ({
  page,
  browser
}, testInfo) => {
  test.setTimeout(180_000);
  const projeto = testInfo.project.name;
  const capturas = marcarCapturas();
  definirRoteiroSmtp({ rcpt: ['550 destinatario recusado'] });
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');

  // 1. O SMTP falso recusa o destinatário: a conta existe, o link aparece, e a frase diz que o e-mail não saiu.
  await criarPeloFormulario(page, LOGIN_CONVIDADO, EMAIL_CONVIDADO);
  await expect(page.getByText(TITULO_CRIAR, { exact: true })).toBeVisible();
  await esperarTopoDoBlocoNaAreaLivreComFoco(page);
  await expect(page.getByText(FRASE_FALHA, { exact: true })).toBeVisible();
  await expect(page.getByText('O link também foi para')).toHaveCount(0);
  const link = (await page.locator('.ar-admin__link').textContent()) ?? '';
  expect(FORMA_DO_LINK.test(link), 'forma do link mostrado quando o e-mail não saiu').toBe(true);
  expect(conversasDesde(capturas), 'o servidor tentou o envio uma vez').toBe(1);
  expect(semEmailCompleto(capturas), 'nenhuma mensagem completa chegou ao SMTP falso').toBe(true);
  await capturarEAnalisar(
    page,
    'painel-email-nao-saiu',
    projeto,
    [VIEWPORT_1280],
    '.ar-admin',
    'em-f1'
  );
  await page.emulateMedia({ colorScheme: 'light' });

  // 2. O link do painel funciona: a conta foi criada mesmo assim.
  const pessoa = await novaPessoa(browser);
  try {
    const aparelho = await pessoa.newPage();
    await abrirLink(aparelho, `${ORIGEM}${new URL(link).pathname}${new URL(link).search}`);
    await esperarFormularioDoConvite(aparelho);
  } finally {
    await pessoa.close();
  }

  // 3. Com o SMTP normal de volta: o mesmo e-mail em outra conta, em maiúsculas, é recusado com a frase do
  //    servidor, e nada é criado; sem arroba, "E-mail inválido.".
  definirRoteiroSmtp();
  await page.getByRole('button', { name: 'Já enviei' }).click();
  await criarPeloFormulario(page, 'outro-sintetico', EMAIL_CONVIDADO.toUpperCase());
  const alerta = page.locator('.ar-admin [role="alert"]');
  await expect(alerta).toHaveText(E_MAIL_EM_USO);
  await expect(page.locator('tbody tr', { hasText: 'outro-sintetico' })).toHaveCount(0);
  await expect(page.locator('input[name="novoUsuario"]')).toHaveValue('outro-sintetico');
  await page.locator('input[name="novoEmail"]').fill('sem-arroba');
  await page.getByRole('button', { name: 'Criar usuário' }).click();
  await expect(alerta).toHaveText(E_MAIL_INVALIDO);
  await expect(page.locator('tbody tr', { hasText: 'outro-sintetico' })).toHaveCount(0);
});

for (const viewport of AMBOS_OS_VIEWPORTS) {
  test(`convite: a ${viewport.largura} px o admin troca o próprio e-mail só com a senha atual; senha em branco e senha errada são recusadas`, async ({
    page
  }, testInfo) => {
    test.setTimeout(180_000);
    const projeto = testInfo.project.name;
    // O viewport vale desde a entrada: a 360 px o menu lateral vira gaveta ao carregar, não ao redimensionar.
    await page.setViewportSize({ width: viewport.largura, height: viewport.altura });
    await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
    const propria = page.locator('tbody tr', { hasText: CONTA_ADMIN.usuario });
    await expect(propria.locator('td[data-rotulo="Estado"]')).toContainText('Sem e-mail');
    await propria.locator('button[data-acao="trocar-email"]').click();

    const campoEmail = page.locator('input[name="emailEditado"]');
    const campoSenha = page.getByLabel('Senha atual');
    await expect(campoEmail).toBeFocused();
    await expect(campoSenha).toHaveAttribute('type', 'password');
    await expect(campoSenha).toHaveAttribute('autocomplete', 'current-password');
    for (const [alvo, descricao] of [
      [campoEmail, 'o campo E-mail'],
      [campoSenha, 'o campo Senha atual'],
      [
        page.locator('form.ar-admin__trocar-email button[data-acao="salvar-email"]'),
        'o botão Trocar e-mail'
      ],
      [
        page.locator('form.ar-admin__trocar-email button[data-acao="cancelar-email"]'),
        'o botão Cancelar'
      ]
    ] as const) {
      await conferirAlcancavelPorRolagem(alvo, descricao);
    }
    await capturarEAnalisar(
      page,
      'painel-trocar-email-propria',
      projeto,
      [viewport],
      '.ar-admin',
      'em-f1'
    );
    await page.emulateMedia({ colorScheme: 'light' });

    const enviar = page.locator('form.ar-admin__trocar-email button[data-acao="salvar-email"]');
    const alerta = page.locator('.ar-admin [role="alert"]');
    await campoEmail.fill('Admin.Sintetico@Example.com');

    // Senha em branco: o servidor recusa e a frase dele aparece; nada muda.
    await enviar.click();
    await expect(alerta).toHaveText(SENHA_ATUAL_EXIGIDA);

    // Senha errada: recusada, o campo de senha esvazia, o de e-mail segue como estava.
    await campoSenha.fill('senha-errada-sintetica-1');
    await enviar.click();
    await expect(alerta).toHaveText(SENHA_ATUAL_NAO_CONFERE);
    await expect(campoSenha).toHaveValue('');
    await expect(campoEmail).toHaveValue('Admin.Sintetico@Example.com');
    await expect(propria.locator('td[data-rotulo="E-mail"]')).toHaveText('');

    // Senha certa: o campo fecha, o foco volta ao botão, e a lista mostra o e-mail em minúsculas.
    await campoSenha.fill(CONTA_ADMIN.senha);
    await enviar.click();
    await expect(page.locator('form.ar-admin__trocar-email')).toHaveCount(0);
    await expect(propria.locator('td[data-rotulo="E-mail"]')).toHaveText(
      'admin.sintetico@example.com'
    );
    await expect(propria.locator('td[data-rotulo="Estado"]')).not.toContainText('Sem e-mail');
    await expect(propria.locator('button[data-acao="trocar-email"]')).toBeFocused();

    // Nem o e-mail nem a senha ficam em armazenamento local ou de sessão (só booleanos: nada vai a log).
    const guardado = await page.evaluate(() =>
      JSON.stringify([...Object.entries(localStorage), ...Object.entries(sessionStorage)])
    );
    expect(guardado.toLowerCase().includes('admin.sintetico'), 'e-mail em armazenamento').toBe(
      false
    );
    expect(guardado.includes(CONTA_ADMIN.senha), 'senha atual em armazenamento').toBe(false);
    expect(guardado.includes('senha-errada-sintetica-1'), 'senha errada em armazenamento').toBe(
      false
    );
  });
}
