import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  RaceRegistrationCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { raceApiService } from '../../../../../services/RaceApiService.ts';
import { CallbackDataSerializer } from '../../../../config/callback/CallbackDataSerializer.ts';
import { logger } from '../../../../../utils/Logger.ts';
import { quickTrackRaceRegistrationClick } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';

export class RaceRegistrationCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'race_registration';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const callbackData = input.callbackData as RaceRegistrationCallbackData;
      const { raceId, uf } = callbackData;

      logger.info('Handling race registration click', {
        module: 'RaceRegistrationCallbackHandler',
        action: 'track_registration_click',
        raceId,
        userId: input.user?.id?.toString(),
      });

      const race = await raceApiService.getRaceById(raceId);

      if (!race) {
        return {
          text: '❌ Corrida não encontrada.',
          format: 'HTML',
          editMessage: true,
        };
      }

      // Track registration click
      if (input.user?.id) {
        try {
          const telegramContext: TelegramContext = {
            userId:
              typeof input.user.id === 'number'
                ? input.user.id
                : parseInt(String(input.user.id)),
            chatId: 0, // Chat ID not available in this context
            messageId:
              typeof input.messageId === 'number' ? input.messageId : undefined,
            username: input.user.name,
          };

          await quickTrackRaceRegistrationClick(
            race.id,
            telegramContext,
            race.title,
            race.link,
            'external'
          );

          logger.info('Race registration click tracked successfully', {
            module: 'RaceRegistrationCallbackHandler',
            raceId: race.id,
            userId: String(input.user.id),
          });
        } catch (trackingError) {
          logger.error(
            'Failed to track race registration click',
            {
              module: 'RaceRegistrationCallbackHandler',
              raceId: race.id,
              userId: String(input.user.id),
            },
            trackingError as Error
          );
        }
      }

      return {
        text: `🔗 <b>${race.title}</b>\n\nClique no botão abaixo para acessar as inscrições:`,
        format: 'HTML',
        editMessage: true,
        keyboard: {
          inline: true,
          buttons: [
            [
              {
                text: 'Iniciar Inscrição',
                url: race.link,
              },
            ],
            [
              {
                text: '⬅️ Voltar aos Detalhes',
                callbackData: CallbackDataSerializer.raceDetail(race.id, uf),
              },
            ],
          ],
        },
      };
    } catch (error) {
      logger.error(
        'Error in RaceRegistrationCallbackHandler',
        {
          module: 'RaceRegistrationCallbackHandler',
          action: 'handle_callback',
          userId: input.user?.id?.toString(),
        },
        error as Error
      );

      return {
        text: '❌ Erro ao processar solicitação de inscrição.',
        format: 'HTML',
        editMessage: true,
      };
    }
  }
}

export const raceRegistrationCallbackHandler =
  new RaceRegistrationCallbackHandler();
