# 🤖 AI Agent Interaction Guide - DashBot

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Padrões de Implementação](#padrões-de-implementação)
- [Sistema de Comandos](#sistema-de-comandos)
- [Sistema de Callbacks](#sistema-de-callbacks)
- [Services e APIs](#services-e-apis)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Comandos Comuns](#comandos-comuns)

## 🎯 Visão Geral

**DashBot** é um bot multiplataforma (foco em Telegram) para corridas de rua, desenvolvido com **Clean Architecture** + **Domain Driven Design**. Este documento orienta agentes IA sobre como interagir efetivamente com o projeto.

### Stack Principal
- **Node.js + TypeScript** (ES Modules, strict mode)
- **Vitest** para testes
- **Custom HTTP Client** para APIs externas
- **node-telegram-bot-api** para Telegram
- **Express** para health checks
- **Fly.io** para deploy

### Domínios de Negócio
1. **Corridas** - Listagem, busca, detalhes, lembretes
2. **Usuários** - Registro, preferências, perfil
3. **Mensagens** - Histórico, interceptação, tracking
4. **Notificações** - Lembretes, alertas, comunicações

## 🏗️ Arquitetura do Projeto

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    ADAPTERS (Entrada)                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Telegram      │  │   WhatsApp      │                  │
│  │   Adapter       │  │   (Futuro)      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────┬───────────────────────────────────┘
                         │ Message & Callback Flow
┌─────────────────────────┼───────────────────────────────────┐
│                    BOT LAYER                                │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ CommandRouter   │   │   │ MessageInter-   │              │
│  │ + Registry      │   │   │ ceptor          │              │
│  └─────────────────┘   │   └─────────────────┘              │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ Commands por    │   │   │ Callbacks       │              │
│  │ Use Case        │   │   │ System          │              │
│  └─────────────────┘   │   └─────────────────┘              │
└─────────────────────────┼───────────────────────────────────┘
                         │ Business Logic
┌─────────────────────────┼───────────────────────────────────┐
│                    SERVICES LAYER                           │
│  ┌─────────────────┐   │   ┌─────────────────┐              │
│  │ HTTP Client     │   │   │ Domain Services │              │
│  │ (Custom)        │   │   │ (Race, User)    │              │
│  └─────────────────┘   │   └─────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo Principal
1. **Recepção**: Adapter recebe mensagem/callback da plataforma
2. **Roteamento**: CommandRouter identifica e roteia comando
3. **Interceptação**: MessageInterceptor salva mensagem de entrada
4. **Processamento**: Command handler processa lógica de negócio
5. **Resposta**: Sistema gera resposta com keyboard/buttons
6. **Interceptação**: MessageInterceptor salva resposta
7. **Envio**: Adapter envia resposta para plataforma

## 📁 Estrutura de Diretórios

```
src/
├── adapters/in/          # 🔌 Adapters de entrada
│   ├── telegram/         #   Telegram Bot API
│   ├── whatsapp/         #   WhatsApp (futuro)
│   └── http/             #   Health checks
├── Bot/                  # 🤖 Camada do Bot (Application)
│   ├── commands/         #   Comandos por use case
│   │   └── usecases/
│   │       ├── races/    #     Use cases de corridas
│   │       ├── users/    #     Use cases de usuários
│   │       └── shared/   #     Use cases compartilhados
│   ├── config/           #   Configurações
│   │   ├── commands/     #     Registry de comandos
│   │   └── callback/     #     Sistema de callbacks
│   ├── middleware/       #   Middleware (interceptação)
│   └── router/           #   Roteamento de comandos
├── services/             # 🔧 Serviços de domínio
│   ├── http/             #   HTTP Client customizado
│   ├── UserApiService.ts #   Operações de usuário
│   ├── RaceApiService.ts #   Operações de corridas
│   ├── ChatApiService.ts #   Operações de chat
│   └── MessageApiService.ts # Operações de mensagens
├── types/                # 📝 Definições TypeScript
│   ├── Command.ts        #   Tipos de comandos
│   ├── Service.ts        #   Tipos de serviços
│   ├── PlatformAdapter.ts #  Tipos de adapters
│   └── callbacks/        #   Tipos de callbacks
└── utils/                # 🛠️ Utilitários
    ├── Logger.ts         #   Sistema de logging
    ├── parseCommand.ts   #   Parser de comandos
    └── formatters/       #   Formatadores especializados
```

### 🗂️ Organização por Use Case

O projeto segue organização por **Use Cases** dentro de cada domínio:

```
Bot/commands/usecases/
├── races/                # Domínio: Corridas
│   ├── commands/         #   Comandos de corridas
│   ├── callbacks/        #   Callbacks de corridas  
│   └── index.ts          #   Exportações do domínio
├── users/                # Domínio: Usuários (futuro)
└── shared/               # Compartilhado entre domínios
    ├── commands/         #   Comandos gerais
    ├── callbacks/        #   Callbacks de navegação
    └── index.ts
```

## 🔧 Padrões de Implementação

### 1. Command Pattern

```typescript
// Interface padrão para comandos
type CommandHandler = (input: CommandInput) => Promise<CommandOutput>;

// Estrutura de entrada
interface CommandInput {
  user?: { id?: number | string; name?: string };
  args?: string[];
  platform?: string;
  raw?: unknown;
  callbackData?: CallbackData;
  messageId?: number | string;
}

// Estrutura de saída
interface CommandOutput {
  text: string;
  format?: 'markdown' | 'html';
  messages?: string[];
  keyboard?: InteractionKeyboard;
  editMessage?: boolean;
  location?: { latitude: number; longitude: number };
}
```

### 2. Service Pattern

```typescript
// Padrão para services de domínio
export class RaceApiService {
  private readonly baseUrl = '/races';

  async getAvailableRaces(): Promise<Race[]> {
    try {
      const response = await httpClient.get<Race[]>(`${this.baseUrl}/available`);
      
      logger.info('Retrieved available races', {
        module: 'RaceApiService',
        action: 'get_available_races',
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error('Error retrieving races', {
        module: 'RaceApiService',
        action: 'get_available_races',
      }, error as Error);
      throw error;
    }
  }
}

// Singleton export
export const raceApiService = new RaceApiService();
```

### 3. Callback Pattern

```typescript
// Interface para handlers de callback
export interface CallbackHandler {
  handle(input: CommandInput): Promise<CommandOutput>;
  canHandle(callbackData: CallbackData): boolean;
}

// Implementação típica
export class RaceDetailsCallbackHandler implements CallbackHandler {
  canHandle(callbackData: any): boolean {
    return callbackData?.type === 'race_details';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    const data = input.callbackData as RaceDetailsCallbackData;
    // ... lógica do handler ...
  }
}
```

## 🤖 Sistema de Comandos

### Estrutura de um Comando

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
    // 1. Validação de entrada
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

    // 5. Retorno estruturado
    return {
      text: `🏃‍♂️ <strong>Corridas Disponíveis</strong>\n\nEncontradas ${races.length} corridas:`,
      format: 'HTML',
      keyboard: {
        buttons: raceButtons,
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

### Registro de Comandos

```typescript
// 1. Exportar no módulo de domínio
// src/Bot/commands/usecases/races/commands/index.ts
export const raceCommands = {
  'corridas': listRacesCommand,
  'buscar_distancia': searchRacesByDistanceCommand,
};

// 2. Registrar no CommandRegistry
// src/Bot/config/commands/CommandRegistry.ts
private async registerCommandsFromModule(moduleName: string): Promise<void> {
  switch (moduleName) {
    case 'races': {
      const { raceCommands } = await import('@bot/commands/usecases/races/index.ts');
      this.registerCommands(raceCommands, moduleName);
      break;
    }
  }
}
```

## 🔄 Sistema de Callbacks

### Tipos de Callback

```typescript
// src/types/callbacks/raceCallbacks.ts

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
```

### Serialização de Callbacks

```typescript
// src/Bot/config/callback/CallbackDataSerializer.ts

export class CallbackDataSerializer {
  // Factory methods
  static raceDetails(raceId: string, source?: string): RaceDetailsCallbackData {
    return { type: 'race_details', raceId, source };
  }

  // Serialização para transmissão (limitado a 64 bytes)
  static serialize(data: CallbackData): string {
    switch (data.type) {
      case 'race_details':
        return `rd:${data.raceId}${data.source ? `:${data.source}` : ''}`;
      // ... outros tipos ...
    }
  }

  // Desserialização
  static deserialize(serialized: string): CallbackData {
    const parts = serialized.split(':');
    switch (parts[0]) {
      case 'rd':
        return {
          type: 'race_details',
          raceId: parts[1],
          source: parts[2],
        } as RaceDetailsCallbackData;
      // ... outros prefixos ...
    }
  }
}
```

### Handler de Callback

```typescript
// src/Bot/commands/usecases/races/callbacks/RaceDetailsCallbackHandler.ts

export class RaceDetailsCallbackHandler implements CallbackHandler {
  canHandle(callbackData: any): boolean {
    return callbackData?.type === 'race_details';
  }

  async handle(input: CommandInput): Promise<CommandOutput> {
    const data = input.callbackData as RaceDetailsCallbackData;
    
    // Buscar dados
    const race = await raceApiService.getRaceById(data.raceId);
    
    // Construir resposta
    return {
      text: this.formatRaceDetails(race),
      format: 'HTML',
      keyboard: { buttons: this.buildActionButtons(race), inline: true },
      editMessage: true, // Edita mensagem existente
    };
  }
}
```

## 🔧 Services e APIs

### HTTP Client Architecture

O projeto usa um **HttpClient customizado** que resolve automaticamente a estrutura `ApiResponse`:

```typescript
// Backend retorna:
{
  "success": true,
  "data": { /* dados reais */ },
  "message": "optional"
}

// HttpClient intercepta e retorna apenas:
response.data // ← dados reais diretamente
```

### Service Implementation

```typescript
export class UserApiService {
  private readonly baseUrl = '/users';

  async registerUser(telegramId: string, name: string): Promise<User> {
    try {
      const response = await httpClient.post<User>(`${this.baseUrl}/register`, {
        telegramId,
        name,
      });

      logger.info('User registered successfully', {
        module: 'UserApiService',
        action: 'register_user',
        userId: response.data.id,
        telegramId,
      });

      return response.data; // ← dados diretos, sem response.data.data
    } catch (error) {
      logger.error('Error registering user', {
        module: 'UserApiService',
        action: 'register_user',
        telegramId,
      }, error as Error);
      throw error;
    }
  }
}
```

### Services Disponíveis

- **`userApiService`** - Operações de usuário
- **`raceApiService`** - Operações de corridas
- **`chatApiService`** - Operações de chat
- **`messageApiService`** - Operações de mensagens
- **`healthApiService`** - Health checks

## 📝 Padrões de Código

### 1. Import Paths

```typescript
// Use path aliases configurados
import { CommandInput } from '@app-types/Command.ts';
import { raceApiService } from '@services/index.ts';
import { CallbackDataSerializer } from '@bot/config/callback/CallbackDataSerializer.ts';
import { logger } from '@app-utils/Logger.ts';
```

### 2. Error Handling

```typescript
// Padrão de tratamento de erro
try {
  const result = await someService.doSomething();
  return { text: 'Success!', format: 'HTML' };
} catch (error) {
  logger.error('Operation failed', {
    module: 'ModuleName',
    action: 'action_name',
    userId: input.user?.id,
  }, error as Error);
  
  return {
    text: '❌ Erro interno. Tente novamente.',
    format: 'HTML',
  };
}
```

### 3. Logging Pattern

```typescript
// Log de sucesso
logger.info('Operation completed', {
  module: 'ModuleName',
  action: 'action_name',
  userId: 'user123',
  resultCount: 5,
});

// Log de erro
logger.error('Operation failed', {
  module: 'ModuleName',
  action: 'action_name',
  userId: 'user123',
}, error as Error);

// Log específicos do bot
logger.commandExecution('listRaces', userId);
logger.callbackExecution('race_details', userId);
```

### 4. Interface Building

```typescript
// Padrão para construir keyboards
const buttons: InteractionButton[][] = [
  [
    { text: '🏃‍♂️ 5km', callbackData: CallbackDataSerializer.racesFilter(5) },
    { text: '🏃‍♂️ 10km', callbackData: CallbackDataSerializer.racesFilter(10) },
  ],
  [
    { text: '⬅️ Voltar', callbackData: CallbackDataSerializer.navigation('back') },
  ],
];

return {
  text: 'Escolha uma distância:',
  format: 'HTML',
  keyboard: { buttons, inline: true },
};
```

## 🧪 Testes

### Test Structure

```typescript
// src/Bot/commands/usecases/races/commands/__tests__/listRacesCommand.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listRacesCommand } from '../listRacesCommand.ts';
import { raceApiService } from '@services/index.ts';

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
    const mockRaces = [/* mock data */];
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
    expect(result.keyboard?.buttons).toHaveLength(2);
    expect(result.format).toBe('HTML');
  });
});
```

### Mock Patterns

```typescript
// Mock service
vi.mock('@services/index.ts', () => ({
  raceApiService: {
    getAvailableRaces: vi.fn(),
    getRaceById: vi.fn(),
  },
}));

// Mock logger (se necessário)
vi.mock('@app-utils/Logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    commandError: vi.fn(),
  },
}));
```

## 📋 Comandos Comuns para Agentes

### Development

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar testes
npm test
npm run test:watch
npm run test:coverage

# Linting e formatação
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run type-check
```

### Build e Deploy

```bash
# Build para produção
npm run build

# Deploy para Fly.io
npm run deploy

# Health checks
npm run health:check
npm run health:detailed
```

### 🔍 Debugging

```bash
# Ver logs da aplicação
tail -f logs/application.log

# Testar comando específico
curl -X POST localhost:3001/test-command -d '{"command": "corridas"}'

# Verificar status do bot
npm run health:check
```

## 🎯 Diretrizes para Agentes IA

### 1. Ao Criar Novos Comandos

1. **Determine o domínio** (races, users, shared)
2. **Crie na pasta correta** (`Bot/commands/usecases/{dominio}/commands/`)
3. **Use padrões existentes** (input/output, error handling)
4. **Registre no módulo** (`commands/index.ts`)
5. **Atualize CommandRegistry** se necessário
6. **Crie testes correspondentes**

### 2. Ao Criar Callbacks

1. **Defina tipos** (`types/callbacks/`)
2. **Estenda Serializer** (`CallbackDataSerializer.ts`)
3. **Implemente Handler** (`callbacks/{Domain}CallbackHandler.ts`)
4. **Registre Handler** (`callbacks/index.ts`)
5. **Teste integração completa**

### 3. Ao Criar Services

1. **Siga padrão singleton** (`export const serviceInstance = new Service()`)
2. **Use HttpClient customizado** (já resolve ApiResponse)
3. **Implemente logging completo**
4. **Trate erros adequadamente**
5. **Exporte no `services/index.ts`**

### 4. Best Practices

- **Sempre use TypeScript strict mode**
- **Prefira composition over inheritance**
- **Mantenha functions pequenas e focadas**
- **Use path aliases consistentemente**
- **Log ações importantes para debugging**
- **Teste edge cases e error paths**
- **Valide inputs do usuário**
- **Mantenha keyboards organizados e intuitivos**

### 5. Debugging Tips

- **Use `logger.debug`** para desenvolvimento
- **Verifique `npm run health:check`** para status geral
- **Use `npm test -- {pattern}`** para testes específicos
- **Monitore logs durante desenvolvimento**
- **Teste localmente antes de deploy**

---

**Para agentes IA**: Este projeto segue padrões bem estabelecidos. Ao implementar novas features, sempre consulte exemplos existentes e mantenha consistência com a arquitetura atual.

**Última atualização:** Novembro 2025