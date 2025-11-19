import { describe, it, expect } from 'vitest';
import { startCommand } from '../startCommand.ts';
import { CommandInput } from '../../../../../../types/Command.ts';

describe('StartCommand', () => {
  const createBasicInput = (platform: string, user?: any): CommandInput => ({
    platform,
    user,
    args: [],
    raw: {},
  });

  describe('Success Cases', () => {
    it('should return welcome message with default username', async () => {
      const input = createBasicInput('telegram');
      const result = await startCommand(input);

      expect(result.text).toContain('🏃‍♂️ Olá, Corredor!');
      expect(result.text).toContain('Bem-vindo ao VELOX Bot!');
      expect(result.text).toContain('https://www.veloxrunning.com');
      expect(result.text).toContain('/ajuda');
      expect(result.format).toBe('markdown');
    });

    it('should return welcome message with Telegram first_name', async () => {
      const input = createBasicInput('telegram', { first_name: 'João' });
      const result = await startCommand(input);

      expect(result.text).toContain('Olá, João!');
      expect(result.text).toContain('Bem-vindo ao VELOX Bot!');
      expect(result.format).toBe('markdown');
    });

    it('should return welcome message with Telegram username when no first_name', async () => {
      const input = createBasicInput('telegram', { username: 'joao123' });
      const result = await startCommand(input);

      expect(result.text).toContain('Olá, joao123!');
      expect(result.text).toContain('Bem-vindo ao VELOX Bot!');
      expect(result.format).toBe('markdown');
    });

    it('should return welcome message with WhatsApp name', async () => {
      const input = createBasicInput('whatsapp', { name: 'Maria Silva' });
      const result = await startCommand(input);

      expect(result.text).toContain('Olá, Maria Silva!');
      expect(result.text).toContain('Bem-vindo ao VELOX Bot!');
      expect(result.format).toBe('markdown');
    });

    it('should contain all required information', async () => {
      const input = createBasicInput('telegram', { first_name: 'Test' });
      const result = await startCommand(input);

      // Check for VELOX information
      expect(result.text).toContain('Sobre a VELOX');
      expect(result.text).toContain('Função do Bot');

      // Check for bot functions
      expect(result.text).toContain('Encontrar corridas próximas');
      expect(result.text).toContain('Receber alertas');
      expect(result.text).toContain('Favoritar corridas');
      expect(result.text).toContain('calendário de eventos');

      // Check for official website
      expect(result.text).toContain('https://www.veloxrunning.com');

      // Check for help command reference
      expect(result.text).toContain('/ajuda');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user data gracefully', async () => {
      const input = createBasicInput('telegram');
      const result = await startCommand(input);

      expect(result.text).toContain('Corredor');
      expect(result.format).toBe('markdown');
    });

    it('should handle empty user object', async () => {
      const input = createBasicInput('telegram', {});
      const result = await startCommand(input);

      expect(result.text).toContain('Corredor');
      expect(result.format).toBe('markdown');
    });

    it('should handle unknown platform', async () => {
      const input = createBasicInput('unknown', { name: 'Test' });
      const result = await startCommand(input);

      expect(result.text).toContain('Corredor');
      expect(result.format).toBe('markdown');
    });
  });
});
