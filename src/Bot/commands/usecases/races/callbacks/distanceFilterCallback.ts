import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  DistanceFilterCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/index.ts';
import { distanceFilterView } from '../../../../presentation/views/races/distanceFilterView.ts';
import { logger } from '../../../../../utils/Logger.ts';

export class DistanceFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'distance_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as DistanceFilterCallbackData;
      const { uf, distance } = data;

      logger.info(`Filtering races by distance: ${distance} for UF: ${uf}`, {
        module: 'DistanceFilterCallbackHandler',
        action: 'handle',
        uf,
        distance,
        userId: input.user?.id?.toString(),
      });

      // Buscar corridas filtradas por UF e distância
      let races;

      if (distance === 'ALL') {
        races = await raceApiService.getRacesByUf(uf);
      } else {
        // Buscar todas as corridas do UF e filtrar client-side
        const allRaces = await raceApiService.getRacesByUf(uf);
        const distanceRange = this.mapDistanceToRange(distance);

        // Filtrar corridas que possuem as distâncias desejadas
        races = allRaces.filter(race => {
          if (!race.distancesNumbers || !Array.isArray(race.distancesNumbers)) {
            return false;
          }

          return race.distancesNumbers.some(
            d => d >= distanceRange.min && d <= distanceRange.max
          );
        });
      }

      if (!races || races.length === 0) {
        return distanceFilterView.createNoRacesFoundView(uf, distance);
      }

      return distanceFilterView.createFilteredRacesView(races, uf, distance);
    } catch (error) {
      logger.error('Failed to filter races by distance', {
        module: 'DistanceFilterCallbackHandler',
        action: 'handle',
        error: String(error),
        userId: input.user?.id?.toString(),
      });

      return distanceFilterView.createErrorView();
    }
  }

  private mapDistanceToRange(distance: string): { min: number; max: number } {
    switch (distance) {
      case '5K-9K':
        return { min: 5, max: 9 };
      case '10K-21K':
        return { min: 10, max: 21 };
      case '42K':
        return { min: 42, max: 42 };
      default:
        return { min: 0, max: 999 }; // ALL distances
    }
  }
}

export const distanceFilterCallbackHandler =
  new DistanceFilterCallbackHandler();
