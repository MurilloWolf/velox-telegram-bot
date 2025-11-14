# 📚 Exemplos Práticos de Implementação - DashBot

## 📋 Índice
- [Exemplo Completo: Feature de Lembretes](#exemplo-completo-feature-de-lembretes)
- [Exemplo: Comando com Paginação](#exemplo-comando-com-paginação)
- [Exemplo: Callback Chain Complex](#exemplo-callback-chain-complex)
- [Exemplo: Service com Cache](#exemplo-service-com-cache)
- [Exemplo: Middleware Customizado](#exemplo-middleware-customizado)
- [Exemplo: Error Handling Avançado](#exemplo-error-handling-avançado)
- [Patterns Úteis](#patterns-úteis)

## 🔔 Exemplo Completo: Feature de Lembretes

Vamos implementar uma feature completa de lembretes para corridas, desde o comando inicial até o callback de confirmação.

### 1. Definir Tipos

```typescript
// src/types/callbacks/reminderCallbacks.ts

import { CallbackData } from './index.ts';

export interface RaceReminderCallbackData extends CallbackData {
  type: 'race_reminder';
  raceId: string;
  action: 'set' | 'cancel' | 'modify' | 'confirm';
  reminderDays?: number;
  reminderTime?: string; // "07:00"
}

export interface ReminderConfigCallbackData extends CallbackData {
  type: 'reminder_config';
  raceId: string;
  step: 'days' | 'time' | 'confirm';
  days?: number;
  time?: string;
}

// src/types/Service.ts (adicionar ao arquivo existente)

export interface CreateReminderRequest {
  userId: string;
  raceId: string;
  reminderDate: Date;
  reminderTime: string;
  raceTitle: string;
  raceDate: Date;
  notificationChannels: ('telegram' | 'email')[];
}

export interface Reminder {
  id: string;
  userId: string;
  raceId: string;
  reminderDate: Date;
  reminderTime: string;
  raceTitle: string;
  raceDate: Date;
  status: 'active' | 'sent' | 'cancelled';
  notificationChannels: ('telegram' | 'email')[];
  createdAt: Date;
}
```

### 2. Criar Service para Lembretes

```typescript
// src/services/ReminderApiService.ts

import { httpClient, HttpResponse } from './http/HttpClient.ts';
import { logger } from '../utils/Logger.ts';
import { CreateReminderRequest, Reminder } from '../types/Service.ts';

export class ReminderApiService {
  private readonly baseUrl = '/reminders';

  async createReminder(request: CreateReminderRequest): Promise<Reminder> {
    try {
      const response = await httpClient.post<Reminder>(
        this.baseUrl,
        request
      );

      logger.info('Reminder created successfully', {
        module: 'ReminderApiService',
        action: 'create_reminder',
        reminderId: response.data.id,
        userId: request.userId,
        raceId: request.raceId,
        reminderDate: request.reminderDate.toISOString(),
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error creating reminder',
        {
          module: 'ReminderApiService',
          action: 'create_reminder',
          userId: request.userId,
          raceId: request.raceId,
        },
        error as Error
      );
      throw error;
    }
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    try {
      const response = await httpClient.get<Reminder[]>(
        `${this.baseUrl}/user/${userId}`
      );

      logger.info('Retrieved user reminders', {
        module: 'ReminderApiService',
        action: 'get_user_reminders',
        userId,
        reminderCount: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error(
        'Error retrieving user reminders',
        {
          module: 'ReminderApiService',
          action: 'get_user_reminders',
          userId,
        },
        error as Error
      );
      throw error;
    }
  }

  async cancelReminder(reminderId: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${reminderId}`);

      logger.info('Reminder cancelled', {
        module: 'ReminderApiService',
        action: 'cancel_reminder',
        reminderId,
      });
    } catch (error) {
      logger.error(
        'Error cancelling reminder',
        {
          module: 'ReminderApiService',
          action: 'cancel_reminder',
          reminderId,
        },
        error as Error
      );
      throw error;
    }
  }

  async getRemindersByRace(raceId: string, userId: string): Promise<Reminder[]> {
    try {
      const response = await httpClient.get<Reminder[]>(
        `${this.baseUrl}/race/${raceId}/user/${userId}`
      );

      return response.data;
    } catch (error) {
      logger.error(
        'Error retrieving race reminders',
        {
          module: 'ReminderApiService',
          action: 'get_race_reminders',
          raceId,
          userId,
        },
        error as Error
      );
      throw error;
    }
  }
}

export const reminderApiService = new ReminderApiService();
```

### 3. Comando Principal

```typescript
// src/Bot/commands/usecases/races/commands/setReminderCommand.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { raceApiService, reminderApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';

export async function setReminderCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    if (!input.user?.id) {
      return {
        text: '❌ Erro: usuário não identificado',
        format: 'HTML',
      };
    }

    // Extrair ID da corrida dos argumentos
    const raceId = input.args?.[0];
    
    if (!raceId) {
      return {
        text: `❌ **Uso:** /lembrete <id_da_corrida>

Para encontrar o ID de uma corrida, use /corridas primeiro.`,
        format: 'HTML',
      };
    }

    // Verificar se a corrida existe
    const race = await raceApiService.getRaceById(raceId);
    
    if (!race) {
      return {
        text: '❌ Corrida não encontrada',
        format: 'HTML',
      };
    }

    // Verificar se já existe lembrete para esta corrida
    const existingReminders = await reminderApiService.getRemindersByRace(
      raceId,
      input.user.id.toString()
    );

    if (existingReminders.length > 0) {
      return {
        text: `⚠️ **Você já tem um lembrete para esta corrida**

🏃‍♂️ **${race.title}**
📅 ${formatDate(race.date)}

O que deseja fazer?`,
        format: 'HTML',
        keyboard: {
          buttons: [
            [
              {
                text: '🔄 Modificar',
                callbackData: CallbackDataSerializer.raceReminder(
                  raceId,
                  'modify'
                ),
              },
              {
                text: '❌ Cancelar',
                callbackData: CallbackDataSerializer.raceReminder(
                  raceId,
                  'cancel'
                ),
              },
            ],
            [
              {
                text: '⬅️ Voltar',
                callbackData: CallbackDataSerializer.navigation('back'),
              },
            ],
          ],
          inline: true,
        },
      };
    }

    // Configurar novo lembrete - mostrar opções de tempo
    const reminderButtons = [
      [
        {
          text: '1 dia antes',
          callbackData: CallbackDataSerializer.reminderConfig(
            raceId,
            'days',
            { days: 1 }
          ),
        },
        {
          text: '3 dias antes',
          callbackData: CallbackDataSerializer.reminderConfig(
            raceId,
            'days',
            { days: 3 }
          ),
        },
      ],
      [
        {
          text: '1 semana antes',
          callbackData: CallbackDataSerializer.reminderConfig(
            raceId,
            'days',
            { days: 7 }
          ),
        },
        {
          text: '2 semanas antes',
          callbackData: CallbackDataSerializer.reminderConfig(
            raceId,
            'days',
            { days: 14 }
          ),
        },
      ],
      [
        {
          text: '⬅️ Voltar',
          callbackData: CallbackDataSerializer.navigation('back'),
        },
      ],
    ];

    return {
      text: `🔔 **Configurar Lembrete**

🏃‍♂️ **${race.title}**
📅 ${formatDate(race.date)}
📍 ${race.location}

⏰ **Quando deseja ser lembrado?**`,
      format: 'HTML',
      keyboard: {
        buttons: reminderButtons,
        inline: true,
      },
    };
  } catch (error) {
    logger.commandError('setReminder', error as Error, input.user?.id);
    return {
      text: '❌ Erro interno. Tente novamente mais tarde.',
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

### 4. Callback Handlers

```typescript
// src/Bot/commands/usecases/races/callbacks/ReminderConfigCallbackHandler.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { CallbackHandler } from '@app-types/PlatformAdapter.ts';
import { ReminderConfigCallbackData } from '@app-types/callbacks/reminderCallbacks.ts';
import { raceApiService, reminderApiService, userApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';

export class ReminderConfigCallbackHandler implements CallbackHandler {
  canHandle(callbackData: any): boolean {
    return callbackData?.type === 'reminder_config';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    try {
      const data = input.callbackData as ReminderConfigCallbackData;
      
      if (!input.user?.id) {
        return {
          text: '❌ Usuário não identificado',
          format: 'HTML',
        };
      }

      const race = await raceApiService.getRaceById(data.raceId);
      
      if (!race) {
        return {
          text: '❌ Corrida não encontrada',
          format: 'HTML',
        };
      }

      switch (data.step) {
        case 'days':
          return this.handleDaysSelection(data, race);
          
        case 'time':
          return this.handleTimeSelection(data, race);
          
        case 'confirm':
          return await this.handleConfirmation(data, race, input.user.id.toString());
          
        default:
          return {
            text: '❌ Etapa de configuração inválida',
            format: 'HTML',
          };
      }
    } catch (error) {
      logger.callbackError(
        'reminder_config',
        error as Error,
        input.user?.id?.toString()
      );
      return {
        text: '❌ Erro ao configurar lembrete',
        format: 'HTML',
      };
    }
  }

  private handleDaysSelection(
    data: ReminderConfigCallbackData,
    race: Race
  ): CommandOutput {
    const timeButtons = [
      [
        {
          text: '🌅 07:00',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'time',
            { days: data.days, time: '07:00' }
          ),
        },
        {
          text: '🌇 18:00',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'time',
            { days: data.days, time: '18:00' }
          ),
        },
      ],
      [
        {
          text: '🌙 20:00',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'time',
            { days: data.days, time: '20:00' }
          ),
        },
        {
          text: '🌃 21:00',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'time',
            { days: data.days, time: '21:00' }
          ),
        },
      ],
      [
        {
          text: '⬅️ Voltar',
          callbackData: CallbackDataSerializer.raceReminder(race.id, 'set'),
        },
      ],
    ];

    const daysText = data.days === 1 ? '1 dia' : `${data.days} dias`;

    return {
      text: `🔔 **Configurar Lembrete**

🏃‍♂️ **${race.title}**
📅 ${this.formatDate(race.date)}

⏰ **Horário do lembrete** (${daysText} antes):`,
      format: 'HTML',
      keyboard: {
        buttons: timeButtons,
        inline: true,
      },
      editMessage: true,
    };
  }

  private handleTimeSelection(
    data: ReminderConfigCallbackData,
    race: Race
  ): CommandOutput {
    const confirmButtons = [
      [
        {
          text: '✅ Confirmar',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'confirm',
            { days: data.days, time: data.time }
          ),
        },
      ],
      [
        {
          text: '⬅️ Voltar',
          callbackData: CallbackDataSerializer.reminderConfig(
            data.raceId,
            'days',
            { days: data.days }
          ),
        },
      ],
    ];

    const daysText = data.days === 1 ? '1 dia' : `${data.days} dias`;
    const reminderDate = new Date(race.date);
    reminderDate.setDate(reminderDate.getDate() - (data.days || 1));

    return {
      text: `🔔 **Confirmar Lembrete**

🏃‍♂️ **${race.title}**
📅 **Data da corrida:** ${this.formatDate(race.date)}

⏰ **Lembrete configurado para:**
📅 ${this.formatDate(reminderDate)} às ${data.time}
(${daysText} antes da corrida)

Confirmar configuração?`,
      format: 'HTML',
      keyboard: {
        buttons: confirmButtons,
        inline: true,
      },
      editMessage: true,
    };
  }

  private async handleConfirmation(
    data: ReminderConfigCallbackData,
    race: Race,
    userId: string
  ): Promise<CommandOutput> {
    try {
      // Calcular data do lembrete
      const reminderDate = new Date(race.date);
      reminderDate.setDate(reminderDate.getDate() - (data.days || 1));
      
      // Definir horário
      const [hours, minutes] = (data.time || '07:00').split(':');
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Criar lembrete
      const reminder = await reminderApiService.createReminder({
        userId,
        raceId: race.id,
        reminderDate,
        reminderTime: data.time || '07:00',
        raceTitle: race.title,
        raceDate: race.date,
        notificationChannels: ['telegram'],
      });

      logger.info('Reminder created via callback', {
        module: 'ReminderConfigCallbackHandler',
        action: 'create_reminder',
        reminderId: reminder.id,
        userId,
        raceId: race.id,
      });

      const actionButtons = [
        [
          {
            text: '📋 Meus Lembretes',
            callbackData: CallbackDataSerializer.navigation('my_reminders'),
          },
          {
            text: '🏃‍♂️ Ver Corrida',
            callbackData: CallbackDataSerializer.raceDetails(race.id),
          },
        ],
        [
          {
            text: '🏠 Menu Principal',
            callbackData: CallbackDataSerializer.navigation('home'),
          },
        ],
      ];

      return {
        text: `✅ **Lembrete Criado com Sucesso!**

🔔 **Você será lembrado:**
📅 ${this.formatDate(reminderDate)} às ${data.time}

🏃‍♂️ **Para a corrida:**
📝 ${race.title}
📅 ${this.formatDate(race.date)}
📍 ${race.location}`,
        format: 'HTML',
        keyboard: {
          buttons: actionButtons,
          inline: true,
        },
        editMessage: true,
      };
    } catch (error) {
      logger.error(
        'Error creating reminder',
        {
          module: 'ReminderConfigCallbackHandler',
          action: 'handle_confirmation',
          userId,
          raceId: race.id,
        },
        error as Error
      );

      return {
        text: '❌ Erro ao criar lembrete. Tente novamente mais tarde.',
        format: 'HTML',
      };
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
```

### 5. Estender Serializer

```typescript
// src/Bot/config/callback/CallbackDataSerializer.ts (adicionar métodos)

export class CallbackDataSerializer {
  // ... métodos existentes ...

  static reminderConfig(
    raceId: string,
    step: 'days' | 'time' | 'confirm',
    options: { days?: number; time?: string } = {}
  ): ReminderConfigCallbackData {
    return {
      type: 'reminder_config',
      raceId,
      step,
      days: options.days,
      time: options.time,
    };
  }

  static raceReminder(
    raceId: string,
    action: 'set' | 'cancel' | 'modify' | 'confirm',
    reminderDays?: number
  ): RaceReminderCallbackData {
    return {
      type: 'race_reminder',
      raceId,
      action,
      reminderDays,
    };
  }

  static serialize(data: CallbackData): string {
    switch (data.type) {
      // ... casos existentes ...
      
      case 'reminder_config':
        const rcData = data as ReminderConfigCallbackData;
        let rcStr = `rc:${rcData.raceId}:${rcData.step}`;
        if (rcData.days) rcStr += `:d${rcData.days}`;
        if (rcData.time) rcStr += `:t${rcData.time}`;
        return rcStr;

      case 'race_reminder':
        const rrData = data as RaceReminderCallbackData;
        let rrStr = `rr:${rrData.raceId}:${rrData.action}`;
        if (rrData.reminderDays) rrStr += `:${rrData.reminderDays}`;
        return rrStr;

      // ... outros casos ...
    }
  }

  static deserialize(serialized: string): CallbackData {
    const parts = serialized.split(':');
    const prefix = parts[0];

    switch (prefix) {
      // ... casos existentes ...
      
      case 'rc': {
        const rcData: ReminderConfigCallbackData = {
          type: 'reminder_config',
          raceId: parts[1],
          step: parts[2] as 'days' | 'time' | 'confirm',
        };

        // Parse optional parameters
        for (let i = 3; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('d')) {
            rcData.days = parseInt(part.substring(1));
          } else if (part.startsWith('t')) {
            rcData.time = part.substring(1);
          }
        }

        return rcData;
      }

      case 'rr': {
        return {
          type: 'race_reminder',
          raceId: parts[1],
          action: parts[2] as 'set' | 'cancel' | 'modify' | 'confirm',
          reminderDays: parts[3] ? parseInt(parts[3]) : undefined,
        } as RaceReminderCallbackData;
      }

      // ... outros casos ...
    }
  }
}
```

### 6. Registrar Tudo

```typescript
// src/Bot/commands/usecases/races/commands/index.ts
export { setReminderCommand } from './setReminderCommand.ts';

export const raceCommands = {
  'corridas': listRacesCommand,
  'lembrete': setReminderCommand, // ← Novo comando
  // ... outros comandos ...
};

// src/Bot/commands/usecases/races/callbacks/index.ts
export { ReminderConfigCallbackHandler } from './ReminderConfigCallbackHandler.ts';

export const raceCallbackHandlers = [
  new RaceDetailsCallbackHandler(),
  new ReminderConfigCallbackHandler(), // ← Novo handler
  // ... outros handlers ...
];

// src/services/index.ts
export { reminderApiService } from './ReminderApiService.ts';
export type { CreateReminderRequest, Reminder } from '../types/Service.ts';
```

## 📄 Exemplo: Comando com Paginação

```typescript
// src/Bot/commands/usecases/races/commands/listAllRacesCommand.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';
import { raceApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';

interface RacesPaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  filters?: {
    distance?: number;
    location?: string;
    month?: number;
  };
}

export async function listAllRacesCommand(
  input: CommandInput
): Promise<CommandOutput> {
  try {
    const page = parseInt(input.args?.[0] || '1');
    const itemsPerPage = 5;
    
    return await generateRacesPage(page, itemsPerPage, input.user?.id?.toString());
  } catch (error) {
    logger.commandError('listAllRaces', error as Error, input.user?.id);
    return {
      text: '❌ Erro ao carregar corridas.',
      format: 'HTML',
    };
  }
}

export async function generateRacesPage(
  page: number,
  itemsPerPage: number,
  userId?: string,
  filters?: any
): Promise<CommandOutput> {
  // Buscar todas as corridas
  const allRaces = await raceApiService.getAvailableRaces();
  
  // Aplicar filtros se necessário
  let filteredRaces = allRaces;
  if (filters?.distance) {
    filteredRaces = filteredRaces.filter(race => 
      race.distances.includes(filters.distance)
    );
  }
  
  const totalItems = filteredRaces.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageRaces = filteredRaces.slice(startIndex, endIndex);

  if (pageRaces.length === 0) {
    return {
      text: '❌ Nenhuma corrida encontrada.',
      format: 'HTML',
    };
  }

  // Construir lista de corridas
  const racesList = pageRaces
    .map((race, index) => {
      const number = startIndex + index + 1;
      return `${number}. 🏃‍♂️ **${race.title}**
📅 ${formatDate(race.date)}
📍 ${race.location}
🏃‍♂️ ${race.distances.join(', ')}km`;
    })
    .join('\n\n');

  // Construir buttons de ação para cada corrida
  const raceButtons = pageRaces.map((race, index) => [
    {
      text: `📋 Detalhes ${startIndex + index + 1}`,
      callbackData: CallbackDataSerializer.raceDetails(race.id, 'list'),
    },
  ]);

  // Controles de paginação
  const paginationButtons = [];
  
  if (page > 1 || page < totalPages) {
    const navRow = [];
    
    if (page > 1) {
      navRow.push({
        text: '⬅️ Anterior',
        callbackData: CallbackDataSerializer.pagination('prev', page - 1, 'races'),
      });
    }
    
    navRow.push({
      text: `📄 ${page}/${totalPages}`,
      callbackData: CallbackDataSerializer.pagination('goto', page, 'races'),
    });
    
    if (page < totalPages) {
      navRow.push({
        text: 'Próximo ➡️',
        callbackData: CallbackDataSerializer.pagination('next', page + 1, 'races'),
      });
    }
    
    paginationButtons.push(navRow);
  }

  // Filtros
  const filterButtons = [
    [
      {
        text: '🔍 Filtrar por 5km',
        callbackData: CallbackDataSerializer.racesFilter(5),
      },
      {
        text: '🔍 Filtrar por 10km',
        callbackData: CallbackDataSerializer.racesFilter(10),
      },
    ],
  ];

  const allButtons = [
    ...raceButtons,
    ...paginationButtons,
    ...filterButtons,
  ];

  logger.info('Generated races page', {
    module: 'listAllRacesCommand',
    action: 'generate_page',
    userId,
    page,
    totalPages,
    itemsOnPage: pageRaces.length,
  });

  return {
    text: `🏃‍♂️ **Todas as Corridas** (${totalItems} encontradas)

${racesList}

📄 **Página ${page} de ${totalPages}**`,
    format: 'HTML',
    keyboard: {
      buttons: allButtons,
      inline: true,
    },
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Callback handler para paginação
export class RacesPaginationCallbackHandler implements CallbackHandler {
  canHandle(callbackData: any): boolean {
    return callbackData?.type === 'pagination' && callbackData?.target === 'races';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    const data = input.callbackData as PaginationCallbackData;
    
    return await generateRacesPage(
      data.page,
      5, // itemsPerPage
      input.user?.id?.toString()
    );
  }
}
```

## 🔧 Exemplo: Service com Cache

```typescript
// src/services/CachedRaceApiService.ts

import { raceApiService } from './RaceApiService.ts';
import { logger } from '../utils/Logger.ts';
import { Race } from '../types/Service.ts';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

export class CachedRaceApiService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  async getAvailableRaces(useCache: boolean = true): Promise<Race[]> {
    const cacheKey = 'available_races';
    
    if (useCache) {
      const cached = this.getFromCache<Race[]>(cacheKey);
      if (cached) {
        logger.debug('Returning cached available races', {
          module: 'CachedRaceApiService',
          action: 'get_available_races_cached',
          cacheHit: true,
        });
        return cached;
      }
    }

    try {
      const races = await raceApiService.getAvailableRaces();
      this.setCache(cacheKey, races, this.defaultTTL);
      
      logger.debug('Fetched and cached available races', {
        module: 'CachedRaceApiService',
        action: 'get_available_races_fresh',
        count: races.length,
        cacheHit: false,
      });

      return races;
    } catch (error) {
      // Em caso de erro, tentar retornar dados do cache mesmo expirados
      const staleData = this.getFromCacheIgnoreTTL<Race[]>(cacheKey);
      if (staleData) {
        logger.warn('Returning stale cached data due to API error', {
          module: 'CachedRaceApiService',
          action: 'get_available_races_stale',
          error: (error as Error).message,
        });
        return staleData;
      }
      
      throw error;
    }
  }

  async getRaceById(raceId: string, useCache: boolean = true): Promise<Race | null> {
    const cacheKey = `race_${raceId}`;
    
    if (useCache) {
      const cached = this.getFromCache<Race>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const race = await raceApiService.getRaceById(raceId);
      if (race) {
        // Cache individual race for longer (race details don't change often)
        this.setCache(cacheKey, race, 15 * 60 * 1000); // 15 minutos
      }
      return race;
    } catch (error) {
      const staleData = this.getFromCacheIgnoreTTL<Race>(cacheKey);
      if (staleData) {
        return staleData;
      }
      throw error;
    }
  }

  // Cache invalidation methods
  invalidateRaceCache(raceId?: string): void {
    if (raceId) {
      this.cache.delete(`race_${raceId}`);
      logger.info('Invalidated race cache', {
        module: 'CachedRaceApiService',
        action: 'invalidate_race_cache',
        raceId,
      });
    } else {
      // Invalidate all race-related cache
      const keysToDelete = Array.from(this.cache.keys()).filter(
        key => key.startsWith('race_') || key === 'available_races'
      );
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      logger.info('Invalidated all race cache', {
        module: 'CachedRaceApiService',
        action: 'invalidate_all_race_cache',
        deletedKeys: keysToDelete.length,
      });
    }
  }

  // Preload popular data
  async preloadCache(): Promise<void> {
    try {
      logger.info('Preloading cache...', {
        module: 'CachedRaceApiService',
        action: 'preload_start',
      });

      // Preload available races
      await this.getAvailableRaces(false);

      logger.info('Cache preload completed', {
        module: 'CachedRaceApiService',
        action: 'preload_complete',
      });
    } catch (error) {
      logger.error('Cache preload failed', {
        module: 'CachedRaceApiService',
        action: 'preload_error',
      }, error as Error);
    }
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private getFromCacheIgnoreTTL<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.data as T : null;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Cache statistics
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  clearCache(): void {
    this.cache.clear();
    logger.info('Cache cleared', {
      module: 'CachedRaceApiService',
      action: 'clear_cache',
    });
  }
}

export const cachedRaceApiService = new CachedRaceApiService();

// Hook para invalidar cache quando necessário
export function invalidateRaceCache(raceId?: string): void {
  cachedRaceApiService.invalidateRaceCache(raceId);
}

// Preload cache na inicialização
export async function initializeRaceCache(): Promise<void> {
  await cachedRaceApiService.preloadCache();
}
```

## ⚡ Patterns Úteis

### 1. Command Factory Pattern

```typescript
// src/Bot/commands/factories/CommandFactory.ts

import { CommandInput, CommandOutput } from '@app-types/Command.ts';

export interface CommandConfig {
  name: string;
  description: string;
  usage: string;
  category: 'races' | 'user' | 'system';
  requiresUser: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export class CommandFactory {
  static createCommand(
    config: CommandConfig,
    handler: (input: CommandInput) => Promise<CommandOutput>
  ): (input: CommandInput) => Promise<CommandOutput> {
    return async (input: CommandInput): Promise<CommandOutput> => {
      // Validação básica
      if (config.requiresUser && !input.user?.id) {
        return {
          text: '❌ Este comando requer identificação do usuário.',
          format: 'HTML',
        };
      }

      // Rate limiting (se configurado)
      if (config.rateLimit) {
        const rateLimitPassed = await rateLimitMiddleware.checkRateLimit(input);
        if (!rateLimitPassed) {
          return {
            text: '⏱️ Muitas tentativas. Aguarde um momento.',
            format: 'HTML',
          };
        }
      }

      try {
        return await handler(input);
      } catch (error) {
        logger.commandError(config.name, error as Error, input.user?.id);
        return {
          text: '❌ Erro interno. Tente novamente.',
          format: 'HTML',
        };
      }
    };
  }

  static createHelpText(config: CommandConfig): string {
    return `**/${config.name}** - ${config.description}

**Uso:** ${config.usage}
**Categoria:** ${config.category}`;
  }
}

// Uso:
const listRacesCommandWithConfig = CommandFactory.createCommand(
  {
    name: 'corridas',
    description: 'Lista corridas disponíveis',
    usage: '/corridas',
    category: 'races',
    requiresUser: true,
    rateLimit: { maxRequests: 5, windowMs: 60000 },
  },
  listRacesCommand
);
```

### 2. Response Builder Pattern

```typescript
// src/utils/ResponseBuilder.ts

import { CommandOutput, InteractionButton } from '@app-types/Command.ts';
import { CallbackData } from '@app-types/callbacks/index.ts';

export class ResponseBuilder {
  private response: Partial<CommandOutput> = {
    format: 'HTML',
  };

  static create(): ResponseBuilder {
    return new ResponseBuilder();
  }

  text(text: string): ResponseBuilder {
    this.response.text = text;
    return this;
  }

  appendText(text: string): ResponseBuilder {
    this.response.text = (this.response.text || '') + text;
    return this;
  }

  format(format: 'HTML' | 'markdown'): ResponseBuilder {
    this.response.format = format;
    return this;
  }

  addButton(text: string, callbackData: CallbackData): ResponseBuilder {
    if (!this.response.keyboard) {
      this.response.keyboard = { buttons: [], inline: true };
    }

    // Add button to last row or create new row if last row is full
    const buttons = this.response.keyboard.buttons;
    if (buttons.length === 0 || buttons[buttons.length - 1].length >= 2) {
      buttons.push([{ text, callbackData }]);
    } else {
      buttons[buttons.length - 1].push({ text, callbackData });
    }

    return this;
  }

  addButtonRow(buttons: { text: string; callbackData: CallbackData }[]): ResponseBuilder {
    if (!this.response.keyboard) {
      this.response.keyboard = { buttons: [], inline: true };
    }

    this.response.keyboard.buttons.push(
      buttons.map(btn => ({ text: btn.text, callbackData: btn.callbackData }))
    );

    return this;
  }

  editMessage(edit: boolean = true): ResponseBuilder {
    this.response.editMessage = edit;
    return this;
  }

  location(latitude: number, longitude: number): ResponseBuilder {
    this.response.location = { latitude, longitude };
    return this;
  }

  // Helper methods for common patterns
  addBackButton(callbackData: CallbackData): ResponseBuilder {
    return this.addButtonRow([{ text: '⬅️ Voltar', callbackData }]);
  }

  addNavigationButtons(
    prevCallback?: CallbackData,
    nextCallback?: CallbackData
  ): ResponseBuilder {
    const navButtons = [];
    if (prevCallback) {
      navButtons.push({ text: '⬅️ Anterior', callbackData: prevCallback });
    }
    if (nextCallback) {
      navButtons.push({ text: 'Próximo ➡️', callbackData: nextCallback });
    }
    
    if (navButtons.length > 0) {
      this.addButtonRow(navButtons);
    }
    
    return this;
  }

  build(): CommandOutput {
    if (!this.response.text) {
      throw new Error('Response text is required');
    }

    return this.response as CommandOutput;
  }
}

// Uso:
const response = ResponseBuilder.create()
  .text('🏃‍♂️ **Corridas Disponíveis**')
  .addButton('Ver Detalhes', CallbackDataSerializer.raceDetails('race-1'))
  .addButton('Filtrar 5km', CallbackDataSerializer.racesFilter(5))
  .addBackButton(CallbackDataSerializer.navigation('home'))
  .build();
```

### 3. Validation Helper

```typescript
// src/utils/ValidationHelper.ts

import { CommandInput } from '@app-types/Command.ts';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ValidationHelper {
  static validateUser(input: CommandInput): void {
    if (!input.user?.id) {
      throw new ValidationError('Usuário não identificado');
    }
  }

  static validateArgs(
    input: CommandInput,
    requiredCount: number,
    usage?: string
  ): void {
    if (!input.args || input.args.length < requiredCount) {
      throw new ValidationError(
        usage || `Este comando requer ${requiredCount} argumento(s)`
      );
    }
  }

  static validateRaceId(raceId: unknown): string {
    if (!raceId || typeof raceId !== 'string' || raceId.trim().length === 0) {
      throw new ValidationError('ID da corrida inválido');
    }
    return raceId.trim();
  }

  static validateDistance(distance: unknown): number {
    const parsed = typeof distance === 'string' ? parseInt(distance) : distance;
    if (typeof parsed !== 'number' || isNaN(parsed) || parsed <= 0 || parsed > 100) {
      throw new ValidationError('Distância deve ser um número entre 1 e 100');
    }
    return parsed;
  }

  static validateDate(date: unknown): Date {
    let parsedDate: Date;

    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'string') {
      parsedDate = new Date(date);
    } else {
      throw new ValidationError('Data inválida');
    }

    if (isNaN(parsedDate.getTime())) {
      throw new ValidationError('Formato de data inválido');
    }

    return parsedDate;
  }

  static validateEmail(email: unknown): string {
    if (typeof email !== 'string') {
      throw new ValidationError('Email deve ser uma string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Formato de email inválido');
    }

    return email.toLowerCase().trim();
  }

  // Usage in commands:
  static createValidatedCommand(
    handler: (input: CommandInput) => Promise<CommandOutput>
  ): (input: CommandInput) => Promise<CommandOutput> {
    return async (input: CommandInput): Promise<CommandOutput> => {
      try {
        return await handler(input);
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            text: `❌ **Erro de Validação**\n\n${error.message}`,
            format: 'HTML',
          };
        }
        throw error; // Re-throw other errors
      }
    };
  }
}

// Uso:
export const setReminderCommand = ValidationHelper.createValidatedCommand(
  async (input: CommandInput): Promise<CommandOutput> => {
    ValidationHelper.validateUser(input);
    ValidationHelper.validateArgs(input, 1, '/lembrete <id_da_corrida>');
    
    const raceId = ValidationHelper.validateRaceId(input.args![0]);
    
    // ... resto da lógica ...
  }
);
```

---

Estes exemplos mostram padrões avançados que podem ser aplicados no projeto para criar features robustas e maintíveis. Cada padrão segue as convenções estabelecidas e pode ser facilmente adaptado para diferentes necessidades.

**Última atualização:** Novembro 2025