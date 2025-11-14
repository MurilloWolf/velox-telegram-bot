export class MessageSanitizer {
  static createCommandSummary(commandText: string): string {
    const command = this.extractCommand(commandText);

    switch (command) {
      case '/start':
        return 'Enviou mensagem de boas-vindas';

      case '/corridas': {
        const hasFilters = commandText.includes(' ');
        if (hasFilters) {
          const filters = commandText.split(' ').slice(1).join(', ');
          return `Enviou corridas filtradas: ${filters}`;
        }
        return 'Enviou lista de corridas';
      }

      case '/proxima_corrida':
        return 'Enviou próxima corrida';

      case '/config':
        return 'Enviou menu de configurações';

      case '/ajuda':
      case '/help':
        return 'Enviou lista de comandos';

      default:
        return `Respondeu ao comando: ${command}`;
    }
  }

  private static extractCommand(text: string): string {
    if (!text.startsWith('/')) {
      return text;
    }

    const parts = text.split(' ');
    return parts[0].toLowerCase();
  }
}
