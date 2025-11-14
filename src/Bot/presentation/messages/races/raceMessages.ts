export const raceMessages = {
  titles: {
    raceList: '🏃‍♂️ Lista de Corridas',
    ufFilter: 'Escolha o estado para ver as corridas disponíveis:',
    racesInState: (uf: string, count: number) =>
      `🗺️ <strong>Corridas em ${uf}</strong> (${count})\n\nSelecione uma corrida para ver mais detalhes:`,
  },

  errors: {
    noRacesFound: (uf: string) =>
      `❌ Nenhuma corrida encontrada no estado de(o) ${getUfFullName(uf)}.`,
    genericError: '❌ Erro ao buscar corridas. Tente novamente mais tarde.',
    raceNotFound: '❌ Corrida não encontrada ou não está mais disponível.',
    noLocation: '❌ Localização não disponível para esta corrida.',
    locationError:
      '❌ Erro ao buscar localização da corrida. Tente novamente mais tarde.',
  },

  success: {
    raceLocation: (raceName: string, location: string, city?: string) =>
      `📍 <strong>Localização da ${raceName}</strong>\n\n🏢 📍 <strong>Local:</strong> ${location}\n <strong>Cidade:</strong> ${city || 'N/A'}`,
  },
} as const;

export function getUfFullName(uf: string): string {
  const ufMap = {
    SP: 'São Paulo',
    PR: 'Paraná',
  } as const;
  return ufMap[uf as keyof typeof ufMap] || uf;
}
