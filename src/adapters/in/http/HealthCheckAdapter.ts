import express from 'express';
import { logger } from '../../../utils/Logger.js';

export class HealthCheckAdapter {
  private app = express();

  constructor(private port = 3001) {
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.performHealthCheck();
        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        logger.error(
          'Health check failed',
          { module: 'HealthCheckAdapter' },
          error as Error
        );
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Internal health check error',
        });
      }
    });

    this.app.get('/health/detailed', async (req, res) => {
      try {
        const detailedHealth = await this.performHealthCheck();
        res.json({
          ...detailedHealth,
          service: 'dash-bot-telegram',
          version: process.env.npm_package_version || '0.3.1',
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid,
        });
      } catch (error) {
        logger.error(
          'Detailed health check failed',
          { module: 'HealthCheckAdapter' },
          error as Error
        );
        res
          .status(503)
          .json({ status: 'error', error: (error as Error).message });
      }
    });
  }

  private async performHealthCheck() {
    const checks = {
      bot: await this.checkTelegramBot(),
      memory: this.checkMemoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    const isHealthy = checks.bot.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      uptime: process.uptime(),
    };
  }

  private async checkTelegramBot() {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return {
          status: 'unhealthy',
          error: 'Bot token not configured',
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
        {
          method: 'GET',
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          botUsername: data.result.username,
          botId: data.result.id,
        };
      }

      return {
        status: 'unhealthy',
        error: 'Bot API unreachable',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message,
      };
    }
  }

  private checkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    return {
      status: memoryUsageMB.rss < 800 ? 'healthy' : 'warning', // Warning se usar mais de 800MB
      usage: memoryUsageMB,
    };
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Health check server running on port ${this.port}`, {
        module: 'HealthCheckAdapter',
        port: this.port,
      });
    });
  }
}
