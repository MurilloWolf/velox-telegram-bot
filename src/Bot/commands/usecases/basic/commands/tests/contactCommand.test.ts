import { describe, it, expect } from 'vitest';
import { contactCommand } from '../contactCommand.ts';
import { CommandInput } from '../../../../../../types/Command.ts';

describe('ContactCommand', () => {
  const createBasicInput = (platform: string): CommandInput => ({
    platform,
    args: [],
    raw: {},
  });

  describe('Success Cases', () => {
    it('should return contact information', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Contato VELOX');
      expect(result.format).toBe('markdown');
    });

    it('should contain email information', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Email');
      expect(result.text).toContain('velox.running.app@gmail.com');
    });

    it('should contain official website', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Site Oficial');
      expect(result.text).toContain('https://velox.run');
    });

    it('should contain telegram support information', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Suporte no Telegram');
      expect(result.text).toContain('@veloxsupport');
    });

    it('should contain social media information', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Redes Sociais');
      expect(result.text).toContain('@runningvelox');
      expect(result.text).toContain('@RunningVelox');
    });

    it('should contain helpful message', async () => {
      const input = createBasicInput('telegram');
      const result = await contactCommand(input);

      expect(result.text).toContain('Estamos aqui para ajudar');
    });
  });

  describe('Platform Independence', () => {
    it('should work for any platform', async () => {
      const platforms = ['telegram', 'whatsapp', 'unknown'];

      for (const platform of platforms) {
        const input = createBasicInput(platform);
        const result = await contactCommand(input);

        expect(result.text).toContain('Contato VELOX');
        expect(result.text).toContain('velox.running.app@gmail.com');
        expect(result.format).toBe('markdown');
      }
    });
  });
});
