// Categorias de Cultura.categoria no backend: cor e ícone (Material Symbols) usados em chips, cards e gráficos
export const CATEGORIAS = {
  folhosa: { nome: 'Folhosa', cor: '#588157', icone: 'eco' },
  frutifera: { nome: 'Frutífera', cor: '#bc4749', icone: 'nutrition' },
  erva: { nome: 'Erva', cor: '#7b5ea7', icone: 'spa' },
  hortalica_fruto: { nome: 'Hortaliça de fruto', cor: '#bc6c25', icone: 'local_florist' },
  outra: { nome: 'Outra', cor: '#78909c', icone: 'potted_plant' },
}

export const OPCOES_CATEGORIA = Object.entries(CATEGORIAS).map(([valor, { nome }]) => ({ valor, nome }))

export function categoriaDe(codigo) {
  return CATEGORIAS[codigo] || CATEGORIAS.outra
}
