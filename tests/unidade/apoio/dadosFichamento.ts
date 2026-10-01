import type { MapaFichamento } from '@/core/fichamento/tipos';

/** Dados pequenos e sintéticos: duas eras, três fases, três pensadores. */
export const DADOS_SINTETICOS: MapaFichamento = {
  titulo: 'Raiz de teste',
  eras: [
    {
      id: 'antiga',
      nome: 'Idade Antiga',
      fases: [
        { id: 'f1', nome: 'Fase um' },
        { id: 'f2', nome: 'Fase dois' }
      ]
    },
    { id: 'media', nome: 'Idade Média', fases: [{ id: 'f3', nome: 'Fase três' }] }
  ],
  pensadores: [
    {
      id: 'alfa',
      nome: 'Alfa',
      datas: '1-2',
      faseId: 'f1',
      obras: ['Obra A'],
      modoDePensar: 'Pensa em açúcar.',
      conceitos: ['Doce', 'Amargo'],
      citacao: { texto: 'texto literal', fonte: 'Fonte A' },
      paraODireito: 'Serve ao direito civil.',
      ressalva: 'Nuance atribuída.',
      referencias: ['REF A'],
      blocoResumo: 'bloco-0'
    },
    {
      id: 'beta',
      nome: 'Beta',
      faseId: 'f2',
      obras: [],
      modoDePensar: 'Pensa em sal.',
      conceitos: ['Salgado'],
      paraODireito: 'Serve ao direito penal.',
      referencias: ['REF B'],
      blocoResumo: 'bloco-1'
    },
    {
      id: 'gama',
      nome: 'Gama',
      faseId: 'f3',
      obras: ['Obra G'],
      modoDePensar: 'Pensa em luz.',
      conceitos: [],
      paraODireito: 'Serve ao direito público.',
      referencias: ['REF G'],
      blocoResumo: 'bloco-2'
    }
  ]
};
