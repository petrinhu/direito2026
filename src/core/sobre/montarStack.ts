/**
 * Pilha e versões que a página Sobre mostra. Função pura: quem lê package.json,
 * package-lock.json e process.versions é vite.config.ts (build) e o teste. Assim
 * o núcleo não toca em disco nem em processo (camada core, sem vue, sem DOM).
 *
 * A versão instalada vem de packages["node_modules/<nome>"], nunca da faixa do
 * package.json nem da versão raiz do lockfile (que pode estar defasada).
 */

export type GrupoDependencia = 'execucao' | 'construcao';

export interface DependenciaDoStack {
  readonly nome: string;
  readonly versao: string;
  readonly licenca: string;
  readonly grupo: GrupoDependencia;
}

export interface StackSite {
  readonly versaoSite: string;
  readonly versaoNode: string;
  readonly dependencias: readonly DependenciaDoStack[];
}

export interface PacoteLido {
  readonly version: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
}

export interface EntradaDoLockfile {
  readonly version?: unknown;
  readonly license?: unknown;
  readonly dev?: unknown;
}

export interface LockfileLido {
  readonly version?: string;
  readonly packages: Readonly<Record<string, EntradaDoLockfile | undefined>>;
}

function lerInstalada(
  lockfile: LockfileLido,
  nome: string
): { readonly versao: string; readonly licenca: string } {
  const entrada = lockfile.packages[`node_modules/${nome}`];
  if (entrada === undefined) {
    throw new Error(
      `montarStack: "${nome}" não está no lockfile. Rode npm install antes do build.`
    );
  }
  const { version, license } = entrada;
  if (typeof version !== 'string' || version === '') {
    throw new Error(`montarStack: "${nome}" no lockfile está sem version.`);
  }
  if (typeof license !== 'string' || license === '') {
    throw new Error(`montarStack: "${nome}" no lockfile está sem license.`);
  }
  return { versao: version, licenca: license };
}

function dependenciasDoGrupo(
  mapa: Readonly<Record<string, string>> | undefined,
  grupo: GrupoDependencia,
  lockfile: LockfileLido
): DependenciaDoStack[] {
  return Object.keys(mapa ?? {})
    .sort()
    .map((nome) => ({ nome, ...lerInstalada(lockfile, nome), grupo }));
}

export function montarStack(
  pacote: PacoteLido,
  lockfile: LockfileLido,
  versaoNode: string
): StackSite {
  if (pacote.version === '') {
    throw new Error('montarStack: package.json sem version.');
  }
  if (versaoNode === '') {
    throw new Error('montarStack: versão do Node do build vazia.');
  }

  const execucao = dependenciasDoGrupo(pacote.dependencies, 'execucao', lockfile);
  const nomesDeExecucao = new Set(execucao.map((d) => d.nome));
  const construcao = dependenciasDoGrupo(pacote.devDependencies, 'construcao', lockfile).filter(
    (d) => !nomesDeExecucao.has(d.nome)
  );

  return {
    versaoSite: pacote.version,
    versaoNode,
    dependencias: [...execucao, ...construcao]
  };
}
