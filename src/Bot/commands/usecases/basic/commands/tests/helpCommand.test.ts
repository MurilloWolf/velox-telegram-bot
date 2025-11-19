import { describe, it, expect } from 'vitest';
import { helpCommand } from '../helpCommand.ts';
import { CommandInput } from '../../../../../../types/Command.ts';

describe('HelpCommand', () => {
  const createBasicInput = (platform: string): CommandInput => ({
    platform,
    args: [],
    raw: {},
  });

  describe('Success Cases', () => {
    it('should return help message with all sections', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Central de Ajuda VELOX Bot');
      expect(result.text).toContain('https://velox.run');
      expect(result.format).toBe('markdown');
    });

    it('should contain basic commands section', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Comandos Básicos');
      expect(result.text).toContain('/start');
      expect(result.text).toContain('/ajuda');
      expect(result.text).toContain('/contato');
      expect(result.text).toContain('/sobre');
      expect(result.text).toContain('/patrocinio');
    });

    it('should contain race commands section', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Comandos de Corrida');
      expect(result.text).toContain('/corridas');
      expect(result.text).toContain('/buscar_corridas');
      expect(result.text).toContain('/proxima_corrida');
      expect(result.text).toContain('/favoritos');
    });

    it('should contain troubleshooting information', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Problemas com o bot');
      expect(result.text).toContain('https://velox.run');
    });

    it('should contain usage tips', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Dica');
      expect(result.text).toContain('Clique em qualquer comando');
    });
  });

  describe('Platform Independence', () => {
    it('should work for telegram platform', async () => {
      const input = createBasicInput('telegram');
      const result = await helpCommand(input);

      expect(result.text).toContain('Central de Ajuda');
      expect(result.format).toBe('markdown');
    });

    it('should work for whatsapp platform', async () => {
      const input = createBasicInput('whatsapp');
      const result = await helpCommand(input);

      expect(result.text).toContain('Central de Ajuda');
      expect(result.format).toBe('markdown');
    });

    it('should work for any platform', async () => {
      const input = createBasicInput('unknown');
      const result = await helpCommand(input);

      expect(result.text).toContain('Central de Ajuda');
      expect(result.format).toBe('markdown');
    });
  });
});
