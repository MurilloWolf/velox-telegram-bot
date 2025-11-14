import { logger } from '../../utils/Logger.ts';

export interface AlertConfig {
  botToken: string;
  alertAgent: string;
  environment: string;
  rateLimitCooldown: number;
}

export interface StartupInfo {
  platform: string;
  environment: string;
  timestamp: Date;
  version?: string;
}

export interface ShutdownInfo {
  signal: string;
  uptime: number;
  timestamp: Date;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AlertOptions {
  level?: AlertLevel;
  disableWebPagePreview?: boolean;
  silent?: boolean;
}

interface AlertRateLimit {
  type: string;
  lastSent: number;
}

export class AlertService {
  private config: AlertConfig;
  private rateLimits = new Map<string, AlertRateLimit>();

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      alertAgent: process.env.TELEGRAM_ALERT_AGENT || '',
      environment: process.env.NODE_ENV || 'development',
      rateLimitCooldown: 60000, // 1 minuto padrão
      ...config,
    };

    this.validateConfig();
  }

  private sanitizeMarkdown(text: string): string {
    // Escape caracteres especiais do Markdown V2 do Telegram
    return text
      .replace(/\\/g, '\\\\') // Escape backslashes first
      .replace(/\*/g, '\\*') // Escape asterisks
      .replace(/_/g, '\\_') // Escape underscores
      .replace(/\[/g, '\\[') // Escape square brackets
      .replace(/\]/g, '\\]') // Escape square brackets
      .replace(/\(/g, '\\(') // Escape parentheses
      .replace(/\)/g, '\\)') // Escape parentheses
      .replace(/~/g, '\\~') // Escape tildes
      .replace(/`/g, '\\`') // Escape backticks
      .replace(/>/g, '\\>') // Escape greater than
      .replace(/#/g, '\\#') // Escape hash
      .replace(/\+/g, '\\+') // Escape plus
      .replace(/-/g, '\\-') // Escape minus
      .replace(/=/g, '\\=') // Escape equals
      .replace(/\|/g, '\\|') // Escape pipe
      .replace(/\{/g, '\\{') // Escape curly braces
      .replace(/\}/g, '\\}') // Escape curly braces
      .replace(/\./g, '\\.') // Escape dots
      .replace(/!/g, '\\!'); // Escape exclamation marks
  }

  private createSafeMarkdownMessage(text: string): string {
    // Para mensagens simples, usar texto sem formatação especial
    // Apenas manter algumas formatações básicas seguras
    return text
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Converter bold duplo para simples
      .replace(/__(.*?)__/g, '_$1_'); // Converter itálico duplo para simples
  }

  private validateConfig(): void {
    if (!this.config.botToken) {
      logger.warn('Alert service initialized without TELEGRAM_BOT_TOKEN', {
        module: 'AlertService',
      });
    }

    if (!this.config.alertAgent) {
      logger.warn('Alert service initialized without TELEGRAM_ALERT_AGENT', {
        module: 'AlertService',
      });
    }
  }

  private shouldSendAlert(type: string): boolean {
    // Só enviar alertas em produção
    if (this.config.environment !== 'production') {
      logger.info('Alert skipped - development environment', {
        module: 'AlertService',
        type,
        environment: this.config.environment,
      });
      return false;
    }

    // Verificar configuração
    if (!this.config.botToken || !this.config.alertAgent) {
      logger.warn('Alert skipped - missing configuration', {
        module: 'AlertService',
        type,
        hasBotToken: !!this.config.botToken,
        hasAlertAgent: !!this.config.alertAgent,
      });
      return false;
    }

    // Verificar rate limiting
    const rateLimit = this.rateLimits.get(type);
    if (rateLimit) {
      const now = Date.now();
      if (now - rateLimit.lastSent < this.config.rateLimitCooldown) {
        logger.info('Alert skipped - rate limited', {
          module: 'AlertService',
          type,
          cooldownRemaining:
            this.config.rateLimitCooldown - (now - rateLimit.lastSent),
        });
        return false;
      }
    }

    return true;
  }

  private updateRateLimit(type: string): void {
    this.rateLimits.set(type, {
      type,
      lastSent: Date.now(),
    });
  }

  private getAlertIcon(level: AlertLevel): string {
    const icons: Record<AlertLevel, string> = {
      info: '📢',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };
    return icons[level];
  }

  async sendAlert(
    message: string,
    options: AlertOptions = {}
  ): Promise<boolean> {
    const level = options.level || 'info';
    const alertType = `general_${level}`;

    if (!this.shouldSendAlert(alertType)) {
      return false;
    }

    try {
      const alertUrl = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

      // Sanitizar a mensagem para evitar problemas de parsing
      const safMessage = this.createSafeMarkdownMessage(message);

      const response = await fetch(alertUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.alertAgent,
          text: safMessage,
          parse_mode: 'Markdown',
          disable_web_page_preview: options.disableWebPagePreview ?? true,
          disable_notification: options.silent ?? false,
        }),
      });

      if (response.ok) {
        this.updateRateLimit(alertType);
        logger.info('Alert sent successfully', {
          module: 'AlertService',
          level,
          type: alertType,
        });
        return true;
      } else {
        const errorData = await response.json();
        logger.error('Failed to send alert', {
          module: 'AlertService',
          level,
          type: alertType,
          error: JSON.stringify(errorData),
        });
        return false;
      }
    } catch (error) {
      logger.error('Error sending alert', {
        module: 'AlertService',
        level,
        type: alertType,
        error: (error as Error).message,
      });
      return false;
    }
  }

  async sendStartupAlert(info: StartupInfo): Promise<boolean> {
    const alertType = 'startup';

    if (!this.shouldSendAlert(alertType)) {
      return false;
    }

    const message = `✅ *DashBot Started Successfully*

🚀 *Status:* Bot is now running
🕒 *Time:* ${info.timestamp.toLocaleString('pt-BR')}
🌍 *Environment:* ${info.environment}
🤖 *Platform:* ${info.platform}${info.version ? `\n📦 *Version:* ${info.version}` : ''}

📊 *Health monitoring is active*`;

    const success = await this.sendAlert(message, { level: 'info' });

    if (success) {
      this.updateRateLimit(alertType);
    }

    return success;
  }

  async sendShutdownAlert(info: ShutdownInfo): Promise<boolean> {
    const alertType = 'shutdown';

    if (!this.shouldSendAlert(alertType)) {
      return false;
    }

    const uptimeMinutes = Math.floor(info.uptime / 60);

    const message = `⚠️ *DashBot Shutdown*

🔄 *Signal:* ${info.signal}
🕒 *Time:* ${info.timestamp.toLocaleString('pt-BR')}
⏱ *Uptime:* ${uptimeMinutes} minutes

🔧 *Process is shutting down gracefully*`;

    const success = await this.sendAlert(message, { level: 'warning' });

    if (success) {
      this.updateRateLimit(alertType);
    }

    return success;
  }

  async sendErrorAlert(info: ErrorInfo): Promise<boolean> {
    const alertType = 'error';

    if (!this.shouldSendAlert(alertType)) {
      return false;
    }

    const contextInfo = info.context
      ? Object.entries(info.context)
          .map(([key, value]) => `*${key}:* ${String(value)}`)
          .join('\n')
      : '';

    const message = `🚨 *DashBot Error*

❌ *Message:* ${info.message}
🕒 *Time:* ${info.timestamp.toLocaleString('pt-BR')}
${contextInfo ? `\n📋 *Context:*\n${contextInfo}` : ''}

🔧 *Please check logs for details*`;

    const success = await this.sendAlert(message, { level: 'error' });

    if (success) {
      this.updateRateLimit(alertType);
    }

    return success;
  }

  async sendCriticalAlert(info: ErrorInfo): Promise<boolean> {
    const alertType = 'critical';

    // Critical alerts bypass rate limiting in production
    if (
      this.config.environment === 'production' &&
      (!this.config.botToken || !this.config.alertAgent)
    ) {
      logger.warn('Critical alert skipped - missing configuration', {
        module: 'AlertService',
        type: alertType,
      });
      return false;
    }

    if (this.config.environment !== 'production') {
      logger.info('Critical alert skipped - development environment', {
        module: 'AlertService',
        type: alertType,
      });
      return false;
    }

    const contextInfo = info.context
      ? Object.entries(info.context)
          .map(([key, value]) => `*${key}:* ${String(value)}`)
          .join('\n')
      : '';

    const message = `🚨 *DashBot Critical Error*

💥 *Message:* ${info.message}
🕒 *Time:* ${info.timestamp.toLocaleString('pt-BR')}
${contextInfo ? `\n📋 *Context:*\n${contextInfo}` : ''}

⚠️ *Immediate attention required*`;

    try {
      const alertUrl = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

      const response = await fetch(alertUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.alertAgent,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          disable_notification: false, // Critical alerts are never silent
        }),
      });

      if (response.ok) {
        logger.info('Critical alert sent successfully', {
          module: 'AlertService',
          type: alertType,
        });
        return true;
      } else {
        const errorData = await response.json();
        logger.error('Failed to send critical alert', {
          module: 'AlertService',
          type: alertType,
          error: JSON.stringify(errorData),
        });
        return false;
      }
    } catch (error) {
      logger.error('Error sending critical alert', {
        module: 'AlertService',
        type: alertType,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // Método para configurar rate limiting customizado
  setRateLimitCooldown(cooldownMs: number): void {
    this.config.rateLimitCooldown = cooldownMs;
    logger.info('Rate limit cooldown updated', {
      module: 'AlertService',
      cooldownMs,
    });
  }

  // Método para limpar rate limits (útil em testes)
  clearRateLimits(): void {
    this.rateLimits.clear();
    logger.info('Rate limits cleared', {
      module: 'AlertService',
    });
  }

  // Método para verificar o status do serviço
  getStatus(): {
    configured: boolean;
    environment: string;
    rateLimitsActive: number;
  } {
    return {
      configured: !!(this.config.botToken && this.config.alertAgent),
      environment: this.config.environment,
      rateLimitsActive: this.rateLimits.size,
    };
  }
}

// Singleton instance following the project's pattern
export const alertService = new AlertService();
