import { logger } from '../../utils/Logger.ts';
import { alertService } from '../Alert/AlertService.ts';

interface BotHealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  checks?: {
    bot: { status: string; botUsername?: string; error?: string };
    memory: {
      status: string;
      usage?: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
    };
  };
  uptime?: number;
  timestamp?: string;
  error?: string;
}

interface AlertConfig {
  checkInterval: number;
  alertCooldown: number;
}

export class BotHealthMonitor {
  private lastKnownStatus = 'unknown';
  private lastAlertTime = 0;
  private monitoringInterval?: NodeJS.Timeout;
  private config: AlertConfig;

  constructor() {
    const oneMinute = 60 * 1000;
    const fiveMinutes = 5 * oneMinute;
    this.config = {
      checkInterval: oneMinute,
      alertCooldown: fiveMinutes,
    };
  }

  async checkBotStatus(): Promise<BotHealthStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          status: 'unhealthy',
          error: `Health endpoint failed: HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return {
        ...data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: `Health check connection failed: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private formatAlertMessage(status: BotHealthStatus): string {
    const statusEmoji =
      status.status === 'healthy'
        ? '✅'
        : status.status === 'warning'
          ? '⚠️'
          : '🚨';
    const timestamp = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    let message = `${statusEmoji} <b>DashBot Status Alert</b>\n\n`;
    message += `📊 <b>Status:</b> ${status.status.toUpperCase()}\n`;
    message += `🕒 <b>Timestamp:</b> ${timestamp}\n`;

    if (status.uptime) {
      const uptimeMinutes = Math.floor(status.uptime / 60);
      const uptimeHours = Math.floor(uptimeMinutes / 60);
      message += `⏱ <b>Uptime:</b> ${uptimeHours}h ${uptimeMinutes % 60}m\n`;
    }

    if (status.checks) {
      message += `\n📋 <b>Detalhes:</b>\n`;

      if (status.checks.bot) {
        const botEmoji = status.checks.bot.status === 'healthy' ? '✅' : '❌';
        message += `${botEmoji} <b>Telegram Bot:</b> ${status.checks.bot.status}\n`;
        if (status.checks.bot.error) {
          message += `   └ Error: ${status.checks.bot.error}\n`;
        }
        if (status.checks.bot.botUsername) {
          message += `   └ Username: @${status.checks.bot.botUsername}\n`;
        }
      }

      if (status.checks.memory) {
        const memEmoji =
          status.checks.memory.status === 'healthy' ? '✅' : '⚠️';
        message += `${memEmoji} <b>Memory:</b> ${status.checks.memory.status}\n`;
        if (status.checks.memory.usage) {
          message += `   └ RSS: ${status.checks.memory.usage.rss}MB\n`;
          message += `   └ Heap: ${status.checks.memory.usage.heapUsed}/${status.checks.memory.usage.heapTotal}MB\n`;
        }
      }
    }

    if (status.error) {
      message += `\n❌ <b>Error:</b> ${status.error}\n`;
    }

    message += `\n🔗 <b>App:</b> dash-bot-telegram`;

    return message;
  }

  private shouldSendAlert(currentStatus: string): boolean {
    const now = Date.now();
    const statusChanged = currentStatus !== this.lastKnownStatus;
    const cooldownExpired =
      now - this.lastAlertTime > this.config.alertCooldown;

    return statusChanged || (currentStatus === 'unhealthy' && cooldownExpired);
  }

  startMonitoring(): void {
    logger.info('Starting bot health monitoring', {
      module: 'BotHealthMonitor',
      interval: this.config.checkInterval,
    });

    this.performHealthCheck();

    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);

    process.on('SIGINT', () => this.stopMonitoring());
    process.on('SIGTERM', () => this.stopMonitoring());
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const status = await this.checkBotStatus();

      logger.info('Health check performed', {
        module: 'BotHealthMonitor',
        status: status.status,
        uptime: status.uptime,
      });

      if (this.shouldSendAlert(status.status)) {
        const alertLevel =
          status.status === 'healthy'
            ? 'info'
            : status.status === 'warning'
              ? 'warning'
              : 'error';

        await alertService.sendAlert(this.formatAlertMessage(status), {
          level: alertLevel,
        });
        this.lastAlertTime = Date.now();
      }

      this.lastKnownStatus = status.status;
    } catch (error) {
      logger.error('Health check failed', {
        module: 'BotHealthMonitor',
        error: (error as Error).message,
      });

      if (this.shouldSendAlert('unhealthy')) {
        await alertService.sendCriticalAlert({
          message: `Health Monitor Failed: ${(error as Error).message}`,
          context: { module: 'BotHealthMonitor' },
          timestamp: new Date(),
        });
        this.lastAlertTime = Date.now();
      }
    }
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;

      logger.info('Bot health monitoring stopped', {
        module: 'BotHealthMonitor',
      });
    }
  }

  async sendTestAlert(): Promise<void> {
    const testMessage = `🧪 <b>DashBot Test Alert</b>\n\n✅ <b>Status:</b> Monitoring system is working\n🕒 <b>Time:</b> ${new Date().toLocaleString('pt-BR')}\n\nThis is a test alert to verify the monitoring system.`;
    await alertService.sendAlert(testMessage, { level: 'info' });
  }

  async sendAlert(message: string): Promise<void> {
    await alertService.sendAlert(message, { level: 'info' });
  }

  async simulateUnhealthyBot(): Promise<void> {
    const unhealthyStatus: BotHealthStatus = {
      status: 'unhealthy',
      checks: {
        bot: {
          status: 'unhealthy',
          error: 'Bot API unreachable (SIMULATED for testing)',
        },
        memory: {
          status: 'healthy',
          usage: {
            rss: 120,
            heapTotal: 150,
            heapUsed: 80,
            external: 5,
          },
        },
      },
      uptime: 300, // 5 minutos
      timestamp: new Date().toISOString(),
    };

    const alertMessage = this.formatAlertMessage(unhealthyStatus);
    const testAlert =
      alertMessage +
      '\n\n⚠️ <b>This is a SIMULATED alert for testing purposes</b>';
    await alertService.sendAlert(testAlert, { level: 'error' });
  }

  async simulateHighMemoryUsage(): Promise<void> {
    const memoryWarningStatus: BotHealthStatus = {
      status: 'warning',
      checks: {
        bot: {
          status: 'healthy',
          botUsername: 'dashbot_test',
        },
        memory: {
          status: 'warning',
          usage: {
            rss: 850,
            heapTotal: 500,
            heapUsed: 400,
            external: 20,
          },
        },
      },
      uptime: 7800, // 2h 10m
      timestamp: new Date().toISOString(),
    };

    const alertMessage = this.formatAlertMessage(memoryWarningStatus);
    const testAlert =
      alertMessage +
      '\n\n⚠️ <b>This is a SIMULATED alert for testing purposes</b>';
    await alertService.sendAlert(testAlert, { level: 'warning' });
  }

  async simulateCriticalError(): Promise<void> {
    const criticalMessage = `🚨 <b>DashBot Critical Error (TEST)</b>\n\n❌ <b>System Failure Simulation</b>\n🕒 <b>Time:</b> ${new Date().toLocaleString('pt-BR')}\n⚠️ <b>Error:</b> Connection timeout - service unreachable\n\n🔧 <b>Recommended Actions:</b>\n• Check server connectivity\n• Restart the bot service\n• Review system logs\n\n⚠️ <b>This is a SIMULATED critical error for testing</b>`;
    await alertService.sendAlert(criticalMessage, { level: 'critical' });
  }

  async simulateStartupFailure(): Promise<void> {
    const startupMessage = `🚨 <b>DashBot Startup Failed (TEST)</b>\n\n❌ <b>Service failed to start</b>\n🕒 <b>Time:</b> ${new Date().toLocaleString('pt-BR')}\n⚠️ <b>Error:</b> Unable to connect to Telegram API\n\n🔧 <b>Check:</b>\n• TELEGRAM_BOT_TOKEN configuration\n• Network connectivity\n• Service permissions\n\n⚠️ <b>This is a SIMULATED startup failure for testing</b>`;
    await alertService.sendAlert(startupMessage, { level: 'critical' });
  }
}
