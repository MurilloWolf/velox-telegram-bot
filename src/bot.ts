import dotenv from 'dotenv';
dotenv.config();

import startTelegramBot from './adapters/in/telegram/TelegramBotAdapter.ts';
import { initializeCallbacks } from './Bot/config/callback/CallbackInitializer.ts';
import { logger } from './utils/Logger.ts';
import { HealthCheckAdapter } from './adapters/in/http/HealthCheckAdapter.ts';
import { BotHealthMonitor } from './services/Health/BotHealthMonitor.ts';
import { alertService } from './services/Alert/AlertService.ts';

async function main() {
  logger.botStartup('Iniciando DashBot...');

  const healthServer = new HealthCheckAdapter(3001);
  healthServer.start();

  let healthMonitor: BotHealthMonitor | null = null;
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.TELEGRAM_BOT_TOKEN &&
    process.env.TELEGRAM_ALERT_AGENT
  ) {
    try {
      healthMonitor = new BotHealthMonitor();
      logger.info('Health monitoring initialized with Telegram alerts', {
        module: 'Bot',
        alertAgent: process.env.TELEGRAM_ALERT_AGENT,
        nodeEnv: process.env.NODE_ENV,
      });
    } catch (error) {
      logger.error('Failed to initialize health monitoring', {
        module: 'Bot',
        error: (error as Error).message,
      });
    }
  } else {
    logger.info('Telegram alerting disabled for development environment', {
      module: 'Bot',
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
    });
  }

  logger.info('Inicializando sistema de callbacks...', {
    module: 'Bot',
    action: 'initialize_callbacks',
  });
  await initializeCallbacks();

  const BOT_PLATFORM = process.env.BOT_PLATFORM;
  try {
    switch (BOT_PLATFORM) {
      case 'telegram':
        logger.info('Telegram bot is running...', {
          module: 'Bot',
          action: 'start_telegram_bot',
          platform: 'telegram',
        });
        startTelegramBot();
        break;
      case 'whatsapp':
        logger.info('WhatsApp bot is running...', {
          module: 'Bot',
          action: 'start_whatsapp_bot',
          platform: 'whatsapp',
        });
        break;
      default:
        logger.error(
          "Unsupported BOT_PLATFORM. Bot supported ['Telegram', 'Whatsapp'].",
          {
            module: 'Bot',
            action: 'unsupported_platform',
            platform: BOT_PLATFORM,
          }
        );
    }

    logger.botStartup('DashBot inicializado com sucesso!');

    if (healthMonitor) {
      setTimeout(async () => {
        try {
          healthMonitor!.startMonitoring();
          logger.info('Health monitoring started', {
            module: 'Bot',
          });

          await alertService.sendStartupAlert({
            platform: BOT_PLATFORM || 'unknown',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date(),
          });

          logger.info('Startup alert sent', { module: 'Bot' });
        } catch (error) {
          logger.error('Failed to start monitoring or send startup alert', {
            module: 'Bot',
            error: (error as Error).message,
          });
        }
      }, 10000);
    }

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`, {
        module: 'Bot',
      });

      await alertService.sendShutdownAlert({
        signal,
        uptime: process.uptime(),
        timestamp: new Date(),
      });

      if (healthMonitor) {
        healthMonitor.stopMonitoring();
      }

      setTimeout(() => {
        logger.info('Process exiting...', { module: 'Bot' });
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon/tsx

    process.on('uncaughtException', async error => {
      logger.error('Uncaught Exception', { module: 'Bot' }, error);

      await alertService.sendCriticalAlert({
        message: `Uncaught Exception: ${error.message}`,
        stack: error.stack,
        context: { type: 'uncaughtException' },
        timestamp: new Date(),
      });

      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(
        'Unhandled Promise Rejection',
        { module: 'Bot', promise },
        new Error(String(reason))
      );

      await alertService.sendErrorAlert({
        message: `Unhandled Promise Rejection: ${String(reason)}`,
        context: { type: 'unhandledRejection' },
        timestamp: new Date(),
      });
    });
  } catch (error) {
    logger.error(
      'Error initializing bot',
      {
        module: 'Bot',
        action: 'initialize_error',
      },
      error as Error
    );

    await alertService.sendCriticalAlert({
      message: `Bot startup failed: ${(error as Error).message}`,
      stack: (error as Error).stack,
      context: { action: 'initialize_error' },
      timestamp: new Date(),
    });

    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }
}

main();
