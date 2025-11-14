# 🚀 Guia de Implementação de Features - DashBot

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Implementando Novos Comandos](#implementando-novos-comandos)
- [Implementando Callbacks](#implementando-callbacks)
- [Criando Novos Services](#criando-novos-services)
- [Adicionando Middleware](#adicionando-middleware)
- [Testes](#testes)
- [Deploy](#deploy)
- [Boas Práticas](#boas-práticas)

## 🎯 Visão Geral

Este guia detalha o processo completo para implementar novas funcionalidades no DashBot, desde comandos simples até sistemas complexos de callbacks e serviços externos.

### Arquitetura Principal

```
┌────────────────────────────────────────────────────────────┐
│                    ADAPTERS (External)                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Telegram      │  │   WhatsApp      │                  │
│  │   Adapter       │  │   (Futuro)      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└────────────────────────┬───────────────────────────────────┘
                         │ Message & Callback Flow
┌────────────────────────┼────────────────────────────────────┐
│                    BOT LAYER                                │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ CommandRouter   │   │   │ Middleware      │              │
│  │ + Registry      │   │   │ (Messages)      │              │
│  └─────────────────┘   │   └─────────────────┘              │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ Commands        │   │   │ Callbacks       │              │
│  │ Handlers        │   │   │ System          │              │
│  └─────────────────┘   │   └─────────────────┘              │
└────────────────────────┼────────────────────────────────────┘
                         │ Business Logic
┌────────────────────────┼────────────────────────────────────┐
│                    SERVICES LAYER                           │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ HTTP Client     │   │   │ Domain Services │              │
│  │ (Custom)        │   │   │ (Race, User)    │              │
│  └─────────────────┘   │   └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

### Organização por Use Cases

```
src/
├── adapters/in/          # Adapters de entrada (Telegram, WhatsApp)
├── Bot/                  # Camada do Bot (Application Layer)
│   ├── commands/         # Comandos organizados por domínio
│   │   └── usecases/
│   │       ├── races/    # Use cases de corridas
│   │       ├── users/    # Use cases de usuários
│   │       └── shared/   # Use cases compartilhados
│   ├── config/           # Configurações
│   │   ├── commands/     # Registry de comandos
│   │   └── callback/     # Sistema de callbacks
│   ├── middleware/       # Middleware (interceptação)
│   └── router/           # Roteamento de comandos
├── services/             # Serviços de comunicação externa
├── types/                # Definições de tipos
└── utils/                # Utilitários
```

### Princípios de Organização

1. **Domain-Driven**: Organização por domínio de negócio
2. **Use Case Based**: Comandos agrupados por casos de uso
3. **Clean Architecture**: Separação clara de responsabilidades
4. **Type Safety**: TypeScript em modo strict

## 🤖 Implementando Novos Comandos

### 1. Comando Simples (Sem Dependencies)

**Exemplo: Comando de Ajuda**

```typescript
// src/Bot/commands/usecases/shared/commands/helpCommand.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';

export async function helpCommand(input: CommandInput): Promise<CommandOutput> {
  return {
    text: `
🤖 **DashBot - Comandos Disponíveis**

🏃‍♂️ **Corridas**
• /corridas - Ver corridas disponíveis
• /proxima_corrida - Próxima corrida
• /buscar_corridas - Buscar por critérios

👤 **Perfil**
• /perfil - Suas informações
• /configuracoes - Ajustar preferências

📞 **Suporte**
• /help - Esta mensagem
• /contato - Falar conosco
    `,
    format: 'HTML',
  };
}
```

### 2. Comando com Serviços Externos

**Exemplo: Listar Corridas**

```typescript
// src/Bot/commands/usecases/races/commands/listRacesCommand.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { raceApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';

export async function listRacesCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    // 1. Validação básica
    if (!input.user?.id) {
      return {
        text: '❌ Erro: usuário não identificado',
        format: 'HTML',
      };
    }

    // 2. Buscar dados via service
    const races = await raceApiService.getAvailableRaces();

    // 3. Verificar se há dados
    if (races.length === 0) {
      return {
        text: '❌ Nenhuma corrida disponível no momento!',
        format: 'HTML',
      };
    }

    // 4. Construir interface com callbacks
    const raceButtons = races.slice(0, 10).map(race => [
      {
        text: `🏃‍♂️ ${race.title} - ${race.distances.join('/')}km`,
        callbackData: CallbackDataSerializer.raceDetails(race.id),
      },
    ]);

    const filterButtons = [
      [
        {
          text: '🏃‍♂️ 5km',
          callbackData: CallbackDataSerializer.racesFilter(5),
        },
        {
          text: '🏃‍♂️ 10km',
          callbackData: CallbackDataSerializer.racesFilter(10),
        },
        {
          text: '🏃‍♂️ 21km',
          callbackData: CallbackDataSerializer.racesFilter(21),
        },
      ],
    ];

    // 5. Retorno estruturado
    return {
      text: `🏃‍♂️ <strong>Corridas Disponíveis</strong>

📌 Encontradas ${races.length} corridas. Selecione uma para ver detalhes ou use os filtros:`,
      format: 'HTML',
      keyboard: {
        buttons: [...raceButtons, ...filterButtons],
        inline: true,
      },
    };
  } catch (error) {
    logger.commandError('listRaces', error as Error, input.user?.id);
    return {
      text: '❌ Erro interno. Tente novamente mais tarde.',
      format: 'HTML',
    };
  }
}
```

### 3. Comando com Parâmetros

**Exemplo: Buscar Corridas por Distância**

```typescript
// src/Bot/commands/usecases/races/commands/searchRacesByDistanceCommand.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { raceApiService } from '@services/index.ts';
import { logger } from '@app-utils/Logger.ts';

export async function searchRacesByDistanceCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    // 1. Extrair e validar parâmetros
    const distanceArg = input.args?.[0];

    if (!distanceArg) {
      return {
        text: `❌ **Uso:** /buscar_distancia <distância>

**Exemplos:**
• /buscar_distancia 5
• /buscar_distancia 10
• /buscar_distancia 21`,
        format: 'HTML',
      };
    }

    const distance = parseInt(distanceArg);

    if (isNaN(distance) || distance <= 0) {
      return {
        text: '❌ Distância deve ser um número positivo',
        format: 'HTML',
      };
    }

    // 2. Buscar corridas
    const races = await raceApiService.getRacesByDistance([distance]);

    if (races.length === 0) {
      return {
        text: `❌ Nenhuma corrida encontrada para ${distance}km`,
        format: 'HTML',
      };
    }

    // 3. Formatar resultado
    const raceList = races
      .map(
        race =>
          `🏃‍♂️ **${race.title}**
📅 ${formatDate(race.date)}
📍 ${race.location}
🔗 [Inscrições](${race.link})`
      )
      .join('\n\n');

    return {
      text: `🏃‍♂️ **Corridas ${distance}km**

${raceList}`,
      format: 'HTML',
    };
  } catch (error) {
    logger.commandError(
      'searchRacesByDistance',
      error as Error,
      input.user?.id
    );
    return {
      text: '❌ Erro interno. Tente novamente.',
      format: 'HTML',
    };
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
```

### 4. Registrar Comandos

**4.1. Registrar no Módulo**

```typescript
// src/Bot/commands/usecases/races/commands/index.ts

export { listRacesCommand } from './listRacesCommand.ts';
export { searchRacesByDistanceCommand } from './searchRacesByDistanceCommand.ts';

export const raceCommands = {
  corridas: listRacesCommand,
  buscar_distancia: searchRacesByDistanceCommand,
};
```

**4.2. Exportar no Use Case Principal**

```typescript
// src/Bot/commands/usecases/races/index.ts

export * from './commands/index.ts';
export * from './callbacks/index.ts';

import {
  RaceDetailsCallbackHandler,
  RaceFilterCallbackHandler,
} from './callbacks/index.ts';

export const raceCallbackHandlers = [
  new RaceDetailsCallbackHandler(),
  new RaceFilterCallbackHandler(),
];
```

**4.3. Registrar no CommandRegistry**

```typescript
// src/Bot/config/commands/CommandRegistry.ts

private async registerCommandsFromModule(moduleName: string): Promise<void> {
  // ... código existente ...

  try {
    switch (moduleName) {
      case 'races': {
        const { raceCommands } = await import('@bot/commands/usecases/races/index.ts');
        this.registerCommands(raceCommands, moduleName);
        this.registeredModules.add(moduleName);
        break;
      }
      // ... outros módulos ...
    }
  } catch (error) {
    logger.error(`Erro ao registrar comandos do módulo ${moduleName}`, {
      module: 'CommandRegistry',
      action: 'register_error',
      moduleName,
    }, error as Error);
  }
}
```

## 🔄 Implementando Callbacks

### 1. Definir Tipos de Callback

```typescript
// src/types/callbacks/raceCallbacks.ts

import { CallbackData } from './index.ts';

export interface RaceDetailsCallbackData extends CallbackData {
  type: 'race_details';
  raceId: string;
  source?: 'list' | 'search' | 'recommendation';
}

export interface RaceFilterCallbackData extends CallbackData {
  type: 'races_filter';
  distance: number;
  location?: string;
}

export interface RaceReminderCallbackData extends CallbackData {
  type: 'race_reminder';
  raceId: string;
  action: 'set' | 'cancel' | 'modify';
  reminderDays?: number;
}
```

### 2. Estender Serializer

```typescript
// src/Bot/config/callback/CallbackDataSerializer.ts

export class CallbackDataSerializer {
  // Factory methods
  static raceDetails(raceId: string, source?: string): RaceDetailsCallbackData {
    return { type: 'race_details', raceId, source };
  }

  static racesFilter(
    distance: number,
    location?: string
  ): RaceFilterCallbackData {
    return { type: 'races_filter', distance, location };
  }

  static serialize(data: CallbackData): string {
    switch (data.type) {
      case 'race_details':
        return `rd:${data.raceId}${data.source ? `:${data.source}` : ''}`;

      case 'races_filter':
        return `rf:${data.distance}${
          data.location ? `:${encodeURIComponent(data.location)}` : ''
        }`;

      // ... outros tipos ...

      default:
        throw new Error(`Unsupported callback type: ${data.type}`);
    }
  }

  static deserialize(serialized: string): CallbackData {
    const parts = serialized.split(':');
    const prefix = parts[0];

    switch (prefix) {
      case 'rd':
        return {
          type: 'race_details',
          raceId: parts[1],
          source: parts[2] as 'list' | 'search' | 'recommendation' | undefined,
        } as RaceDetailsCallbackData;

      case 'rf':
        return {
          type: 'races_filter',
          distance: parseInt(parts[1]),
          location: parts[2] ? decodeURIComponent(parts[2]) : undefined,
        } as RaceFilterCallbackData;

      // ... outros prefixos ...

      default:
        throw new Error(`Unknown callback prefix: ${prefix}`);
    }
  }
}
```

### 3. Implementar Handler

```typescript
// src/Bot/commands/usecases/races/callbacks/RaceDetailsCallbackHandler.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { CallbackHandler } from '@app-types/PlatformAdapter.ts';
import { RaceDetailsCallbackData } from '@app-types/callbacks/raceCallbacks.ts';
import { raceApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';

export class RaceDetailsCallbackHandler implements CallbackHandler {
  canHandle(callbackData: any): boolean {
    return callbackData?.type === 'race_details';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as RaceDetailsCallbackData;

      // 1. Validação
      if (!data.raceId) {
        logger.warn('Race details callback without raceId', {
          module: 'RaceDetailsCallbackHandler',
          data,
          userId: input.user?.id,
        });
        return {
          text: '❌ ID da corrida não especificado',
          format: 'HTML',
        };
      }

      // 2. Buscar dados
      const race = await raceApiService.getRaceById(data.raceId);

      if (!race) {
        return {
          text: '❌ Corrida não encontrada',
          format: 'HTML',
        };
      }

      // 3. Formatar detalhes
      const raceDetails = this.formatRaceDetails(race);

      // 4. Construir keyboard
      const actionButtons = this.buildActionButtons(race, data.source);

      // 5. Log da ação
      logger.callbackExecution('race_details', input.user?.id?.toString(), {
        raceId: data.raceId,
        raceTitle: race.title,
        source: data.source,
      });

      return {
        text: raceDetails,
        format: 'HTML',
        keyboard: {
          buttons: actionButtons,
          inline: true,
        },
        editMessage: true, // Edita mensagem existente
      };
    } catch (error) {
      logger.callbackError(
        'race_details',
        error as Error,
        input.user?.id?.toString()
      );
      return {
        text: '❌ Erro ao carregar detalhes da corrida',
        format: 'HTML',
      };
    }
  }

  private formatRaceDetails(race: Race): string {
    const statusEmoji = this.getRaceStatusEmoji(race.status);
    const distancesText = race.distances.join(', ');
    const dateText = this.formatDate(race.date);

    return `
🏃‍♂️ **${race.title}**

🏢 **Organização:** ${race.organization}
📅 **Data:** ${dateText}
⏰ **Horário:** ${race.time}
📍 **Local:** ${race.location}
🏃‍♂️ **Distâncias:** ${distancesText}km
📊 **Status:** ${statusEmoji} ${race.status}

🔗 [Mais informações](${race.link})
    `.trim();
  }

  private buildActionButtons(
    race: Race,
    source?: string
  ): InteractionButton[][] {
    const buttons = [
      [
        {
          text: '🔔 Lembrete',
          callbackData: CallbackDataSerializer.raceReminder(race.id, 'set'),
        },
        {
          text: '📍 Localização',
          callbackData: CallbackDataSerializer.raceLocation(race.id),
        },
      ],
      [
        {
          text: '📤 Compartilhar',
          callbackData: CallbackDataSerializer.shareRace(race.id),
        },
      ],
    ];

    // Botão de voltar baseado na origem
    const backButton = this.getBackButton(source);
    if (backButton) {
      buttons.push([backButton]);
    }

    return buttons;
  }

  // ... métodos auxiliares ...
}
```

### 4. Registrar Handler

```typescript
// src/Bot/commands/usecases/races/callbacks/index.ts

export { RaceDetailsCallbackHandler } from './RaceDetailsCallbackHandler.ts';
export { RaceFilterCallbackHandler } from './RaceFilterCallbackHandler.ts';

export const raceCallbackHandlers = [
  new RaceDetailsCallbackHandler(),
  new RaceFilterCallbackHandler(),
];
```

## 🔧 Criando Novos Services

### 1. Estrutura Base do Service

```typescript
// src/services/NotificationApiService.ts

import { httpClient, HttpResponse } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';

export interface NotificationRequest {
  userId: string;
  type: 'race_reminder' | 'system' | 'promotional';
  title: string;
  message: string;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export class NotificationApiService {
  private readonly baseUrl = '/notifications';

  async createNotification(
    request: NotificationRequest
  ): Promise<Notification> {
    try {
      const response = await httpClient.post<Notification>(
        `${this.baseUrl}`,
        request
      );

      logger.info('Notification created successfully', {
        module: 'NotificationApiService',
        action: 'create_notification',
        notificationId: response.data.id,
        userId: request.userId,
        type: request.type,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error creating notification',
        {
          module: 'NotificationApiService',
          action: 'create_notification',
          userId: request.userId,
          type: request.type,
        },
        error as Error
      );
      throw error;
    }
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    try {
      const response = await httpClient.get<Notification[]>(
        `${this.baseUrl}/user/${userId}`
      );

      logger.info('Retrieved notifications for user', {
        module: 'NotificationApiService',
        action: 'get_notifications_by_user',
        userId,
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error retrieving notifications',
        {
          module: 'NotificationApiService',
          action: 'get_notifications_by_user',
          userId,
        },
        error as Error
      );
      throw error;
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: 'sent' | 'failed'
  ): Promise<Notification> {
    try {
      const response = await httpClient.patch<Notification>(
        `${this.baseUrl}/${notificationId}/status`,
        { status }
      );

      logger.info('Notification status updated', {
        module: 'NotificationApiService',
        action: 'update_status',
        notificationId,
        newStatus: status,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error updating notification status',
        {
          module: 'NotificationApiService',
          action: 'update_status',
          notificationId,
          status,
        },
        error as Error
      );
      throw error;
    }
  }
}

// Singleton instance
export const notificationApiService = new NotificationApiService();
```

### 2. Atualizar Index de Services

```typescript
// src/services/index.ts

export { httpClient } from './http/HttpClient.ts';
export { userApiService } from './UserApiService.ts';
export { raceApiService } from './RaceApiService.ts';
export { chatApiService } from './ChatApiService.ts';
export { messageApiService } from './MessageApiService.ts';
export { healthApiService } from './HealthApiService.ts';
export { notificationApiService } from './NotificationApiService.ts'; // ← Novo service

// Re-export types
export type {
  NotificationRequest,
  Notification,
} from './NotificationApiService.ts';
```

## 🛡️ Adicionando Middleware

### 1. Criar Novo Middleware

```typescript
// src/Bot/middleware/RateLimitMiddleware.ts

import { CommandInput } from '@app-types/Command.ts';
import { logger } from '../../utils/Logger.ts';

interface RateLimit {
  count: number;
  windowStart: number;
  windowMs: number;
  maxRequests: number;
}

export class RateLimitMiddleware {
  private rateLimits = new Map<string, RateLimit>();
  private defaultWindowMs = 60000; // 1 minuto
  private defaultMaxRequests = 10; // 10 comandos por minuto

  async checkRateLimit(input: CommandInput): Promise<boolean> {
    const userId = input.user?.id?.toString();

    if (!userId) {
      return true; // Permitir se não há usuário identificado
    }

    const now = Date.now();
    const userLimit = this.rateLimits.get(userId) || {
      count: 0,
      windowStart: now,
      windowMs: this.defaultWindowMs,
      maxRequests: this.defaultMaxRequests,
    };

    // Reset window if expired
    if (now - userLimit.windowStart > userLimit.windowMs) {
      userLimit.count = 0;
      userLimit.windowStart = now;
    }

    // Check if limit exceeded
    if (userLimit.count >= userLimit.maxRequests) {
      logger.warn('Rate limit exceeded', {
        module: 'RateLimitMiddleware',
        action: 'rate_limit_exceeded',
        userId,
        count: userLimit.count,
        maxRequests: userLimit.maxRequests,
      });

      return false;
    }

    // Increment counter
    userLimit.count++;
    this.rateLimits.set(userId, userLimit);

    logger.debug('Rate limit check passed', {
      module: 'RateLimitMiddleware',
      action: 'rate_limit_check',
      userId,
      count: userLimit.count,
      maxRequests: userLimit.maxRequests,
    });

    return true;
  }

  setCustomLimit(
    userId: string,
    maxRequests: number,
    windowMs: number = this.defaultWindowMs
  ): void {
    this.rateLimits.set(userId, {
      count: 0,
      windowStart: Date.now(),
      windowMs,
      maxRequests,
    });
  }

  clearUserLimit(userId: string): void {
    this.rateLimits.delete(userId);
  }

  clearAllLimits(): void {
    this.rateLimits.clear();
  }
}

export const rateLimitMiddleware = new RateLimitMiddleware();
```

### 2. Integrar no Router

```typescript
// src/Bot/router/CommandRouter.ts

import { rateLimitMiddleware } from '@bot/middleware/RateLimitMiddleware.ts';

export async function routeCommand(
  command: string,
  input: CommandInput
): Promise<CommandOutput> {
  let output: CommandOutput = {
    text: '',
    format: 'HTML',
  };

  try {
    // 1. Check rate limit
    const rateLimitPassed = await rateLimitMiddleware.checkRateLimit(input);
    if (!rateLimitPassed) {
      return {
        text: '⏱️ Muitos comandos em pouco tempo. Aguarde um momento.',
        format: 'HTML',
      };
    }

    // 2. Interceptar mensagem de entrada
    await messageInterceptor.interceptIncomingMessage(input);

    // 3. Executar comando
    const registry = await getCommandRegistry();
    const handler = registry.getHandler(command);

    if (handler) {
      logger.commandExecution(command, input.user?.id?.toString());
      output = await handler(input);
      await messageInterceptor.interceptOutgoingMessage(input, output);
      return output;
    }

    // ... resto do código ...
  } catch (error) {
    // ... tratamento de erro ...
  }

  return output;
}
```

## 🧪 Testes

### 1. Teste de Comando

```typescript
// src/Bot/commands/usecases/races/commands/__tests__/listRacesCommand.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listRacesCommand } from '../listRacesCommand.ts';
import { raceApiService } from '@services/index.ts';
import { CommandInput } from '@app-types/Command.ts';

// Mock services
vi.mock('@services/index.ts', () => ({
  raceApiService: {
    getAvailableRaces: vi.fn(),
  },
}));

describe('listRacesCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return races with keyboard when races exist', async () => {
    // Arrange
    const mockRaces = [
      {
        id: 'race-1',
        title: 'Test Race',
        distances: [5, 10],
        location: 'Test Location',
        date: new Date('2024-01-15'),
        link: 'https://example.com',
        status: 'OPEN',
      },
    ];

    vi.mocked(raceApiService.getAvailableRaces).mockResolvedValue(mockRaces);

    const input: CommandInput = {
      user: { id: 12345, name: 'Test User' },
      platform: 'telegram',
      args: [],
    };

    // Act
    const result = await listRacesCommand(input);

    // Assert
    expect(result.text).toContain('Corridas Disponíveis');
    expect(result.text).toContain('Encontradas 1 corridas');
    expect(result.keyboard?.buttons).toHaveLength(2); // race + filter buttons
    expect(result.format).toBe('HTML');
    expect(result.keyboard?.buttons[0][0].text).toContain('Test Race');
  });

  it('should return error message when no races exist', async () => {
    // Arrange
    vi.mocked(raceApiService.getAvailableRaces).mockResolvedValue([]);

    const input: CommandInput = {
      user: { id: 12345, name: 'Test User' },
      platform: 'telegram',
      args: [],
    };

    // Act
    const result = await listRacesCommand(input);

    // Assert
    expect(result.text).toContain('Nenhuma corrida disponível');
    expect(result.keyboard).toBeUndefined();
  });

  it('should handle service errors gracefully', async () => {
    // Arrange
    vi.mocked(raceApiService.getAvailableRaces).mockRejectedValue(
      new Error('Service error')
    );

    const input: CommandInput = {
      user: { id: 12345, name: 'Test User' },
      platform: 'telegram',
      args: [],
    };

    // Act
    const result = await listRacesCommand(input);

    // Assert
    expect(result.text).toContain('Erro interno');
    expect(result.format).toBe('HTML');
  });
});
```

### 2. Teste de Callback Handler

```typescript
// src/Bot/commands/usecases/races/callbacks/__tests__/RaceDetailsCallbackHandler.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RaceDetailsCallbackHandler } from '../RaceDetailsCallbackHandler.ts';
import { raceApiService } from '@services/index.ts';
import { CommandInput } from '@app-types/Command.ts';
import { RaceDetailsCallbackData } from '@app-types/callbacks/raceCallbacks.ts';

vi.mock('@services/index.ts', () => ({
  raceApiService: {
    getRaceById: vi.fn(),
  },
}));

describe('RaceDetailsCallbackHandler', () => {
  let handler: RaceDetailsCallbackHandler;

  beforeEach(() => {
    handler = new RaceDetailsCallbackHandler();
    vi.clearAllMocks();
  });

  it('should handle race details callback correctly', async () => {
    // Arrange
    const mockRace = {
      id: 'race-1',
      title: 'Test Race',
      organization: 'Test Org',
      distances: [5, 10],
      location: 'Test Location',
      date: new Date('2024-01-15'),
      time: '07:00',
      link: 'https://example.com',
      status: 'OPEN',
    };

    vi.mocked(raceApiService.getRaceById).mockResolvedValue(mockRace);

    const input: CommandInput = {
      user: { id: 12345, name: 'Test User' },
      platform: 'telegram',
      callbackData: {
        type: 'race_details',
        raceId: 'race-1',
        source: 'list',
      } as RaceDetailsCallbackData,
    };

    // Act
    const result = await handler.handle(input);

    // Assert
    expect(result.text).toContain('Test Race');
    expect(result.text).toContain('Test Org');
    expect(result.text).toContain('Test Location');
    expect(result.keyboard?.buttons).toBeDefined();
    expect(result.editMessage).toBe(true);
    expect(result.format).toBe('HTML');
  });

  it('should handle non-existent race gracefully', async () => {
    // Arrange
    vi.mocked(raceApiService.getRaceById).mockResolvedValue(null);

    const input: CommandInput = {
      user: { id: 12345, name: 'Test User' },
      platform: 'telegram',
      callbackData: {
        type: 'race_details',
        raceId: 'non-existent',
      } as RaceDetailsCallbackData,
    };

    // Act
    const result = await handler.handle(input);

    // Assert
    expect(result.text).toContain('Corrida não encontrada');
    expect(result.format).toBe('HTML');
  });
});
```

### 3. Executar Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage

# Executar testes específicos
npm test -- listRacesCommand
```

## 🚀 Deploy

### 1. Build e Deploy

```bash
# 1. Build da aplicação
npm run build

# 2. Deploy para produção
npm run deploy

# 3. Verificar health
npm run health:check
```

### 2. Environment Variables

```bash
# .env.production
TELEGRAM_BOT_TOKEN=your_production_token
API_BASE_URL=https://your-api.com
NODE_ENV=production
LOG_LEVEL=info
```

## ✅ Boas Práticas

### 1. Estrutura de Código

- **Use TypeScript Strict**: Sempre tipar adequadamente
- **Modularização**: Separe por domínio e responsabilidade
- **Error Handling**: Trate todos os erros gracefully
- **Logging**: Log ações importantes para debugging

### 2. Performance

- **Cache**: Implemente cache quando apropriado
- **Rate Limiting**: Proteja contra spam de comandos
- **Batch Operations**: Agrupe operações quando possível
- **Lazy Loading**: Carregue dados apenas quando necessário

### 3. Segurança

- **Input Validation**: Sempre valide entradas do usuário
- **Sanitization**: Limpe dados antes de envio
- **Authentication**: Verifique permissões quando necessário
- **Rate Limiting**: Implemente limites de uso

### 4. UX

- **Feedback Imediato**: Sempre responda ao usuário
- **Error Messages**: Mensagens de erro claras
- **Loading States**: Indique quando operações demoram
- **Progressive Disclosure**: Mostre informações gradualmente

### 5. Testes

- **Unit Tests**: Teste cada função isoladamente
- **Integration Tests**: Teste fluxos completos
- **Mocking**: Use mocks para dependências externas
- **Coverage**: Mantenha coverage alto

## 📞 Suporte

Para dúvidas sobre implementação:

1. Consulte a documentação técnica em `/copilot/`
2. Verifique exemplos existentes no código
3. Execute testes para validar implementações
4. Use logs para debugging durante desenvolvimento

---

**Última atualização:** Novembro 2025
