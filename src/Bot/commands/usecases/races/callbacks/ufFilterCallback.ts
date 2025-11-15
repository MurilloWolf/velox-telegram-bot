import { CommandInput, CommandOutput } from '../../../../../types/Command.ts';
import { CallbackHandler } from '../../../../../types/PlatformAdapter.ts';
import {
  CallbackData,
  UfFilterCallbackData,
} from '../../../../../types/callbacks/index.ts';
import { distanceFilterView } from '../../../../presentation/views/races/distanceFilterView.ts';
import { useAnalytics } from '../../../../../utils/AnalyticsHelpers.ts';
import { TelegramContext } from '../../../../../types/Analytics.ts';
import { logger } from '../../../../../utils/Logger.ts';

export class UfFilterCallbackHandler implements CallbackHandler {
  canHandle(callbackData: CallbackData): boolean {
    return callbackData.type === 'uf_filter';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    const data = input.callbackData as UfFilterCallbackData;
    const { uf } = data;

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

        const analytics = useAnalytics(telegramContext);
        await analytics.trackFilterChange('uf', uf, { active: 'true' });
      } catch (error) {
        logger.error(
          'Failed to track UF filter',
          {
            module: 'UfFilterCallbackHandler',
            uf,
            userId: String(input.user.id),
          },
          error as Error
        );
      }
    }

    return distanceFilterView.createDistanceFilterView(uf);
  }
}

export const ufFilterCallbackHandler = new UfFilterCallbackHandler();
