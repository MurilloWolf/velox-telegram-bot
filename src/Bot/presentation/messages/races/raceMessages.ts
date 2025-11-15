export const raceMessages = {
  titles: {
    raceList: '🏃‍♂️ Lista de Corridas',
    ufFilter: 'Escolha o estado para ver as corridas disponíveis:',
    distanceFilter: (uf: string) =>
      `📏 <strong>Filtrar por distância em ${getUfFullName(uf)}</strong>\n\nSelecione a faixa de distância que deseja ver:`,
    racesInState: (uf: string, count: number) =>
      `🗺️ <strong>Corridas em ${uf}</strong> (${count})\n\nSelecione uma corrida para ver mais detalhes:`,
    filteredRaces: (uf: string, distance: string, count: number) => {
      const distanceLabel = getDistanceLabel(distance);
      return `🏃‍♂️ <strong>Corridas ${distanceLabel} em ${getUfFullName(uf)}</strong> (${count})\n\nSelecione uma corrida para ver mais detalhes:`;
    },
    // Mensagens para listagem geral de corridas (sem filtro de UF)
    allRacesAvailable: (count: number) =>
      `🏃‍♂️ <strong>Corridas Disponíveis</strong>\\n\\nEncontradas ${count} corrida(s). Selecione uma para ver detalhes:`,
    racesForDistance: (distance: number, count: number) =>
      `🏃‍♂️ <strong>Corridas de ${distance}km</strong>\\n\\nEncontradas ${count} corrida(s):`,
    // Mensagens para corridas favoritas
    favoritesList: (count: number) =>
      `⭐ <strong>Suas Corridas Favoritas</strong> (${count})\\n\\nSelecione uma corrida para ver mais detalhes:`,
    noFavorites: `📝 <b>Suas Corridas Favoritas</b>\\n\\n❌ Você ainda não tem corridas favoritas!\\n\\n💡 Para favoritar uma corrida, use o comando /corridas e clique no botão ❤️ de uma corrida.`,
  },

  errors: {
    noRacesFound: (uf: string) =>
      `❌ Nenhuma corrida encontrada no estado de(o) ${getUfFullName(uf)}.`,
    noRacesFoundByDistance: (uf: string, distance: string) => {
      const distanceLabel = getDistanceLabel(distance);
      return `❌ Nenhuma corrida ${distanceLabel} encontrada em ${getUfFullName(uf)}.`;
    },
    noRacesAvailable: '❌ Nenhuma corrida disponível no momento!',
    noRacesFoundForDistance: (distance: number) =>
      `❌ Nenhuma corrida encontrada para a distância: ${distance}km`,
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

  // Helper methods for generating messages
  createNoRacesFoundMessage: (uf: string, distance: string) => {
    if (distance === 'ALL') {
      return raceMessages.errors.noRacesFound(uf);
    }
    return raceMessages.errors.noRacesFoundByDistance(uf, distance);
  },

  createFilteredRacesMessage: (races: any[], uf: string, distance: string) => {
    const count = races.length;
    if (distance === 'ALL') {
      return raceMessages.titles.racesInState(getUfFullName(uf), count);
    }
    return raceMessages.titles.filteredRaces(uf, distance, count);
  },
} as const;

export function getUfFullName(uf: string): string {
  const ufMap = {
    SP: 'São Paulo',
    PR: 'Paraná',
  } as const;
  return ufMap[uf as keyof typeof ufMap] || uf;
}

export function getDistanceLabel(distance: string): string {
  const distanceMap = {
    ALL: 'de todas as distâncias',
    '5K-9K': 'de 5km a 9km',
    '10K-21K': 'de 10km a 21km',
    '42K': 'de 42km (maratona)',
  } as const;
  return distanceMap[distance as keyof typeof distanceMap] || distance;
}
