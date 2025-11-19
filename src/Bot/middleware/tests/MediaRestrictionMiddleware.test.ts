import { describe, it, expect } from 'vitest';
import { MediaRestrictionMiddleware } from '../MediaRestrictionMiddleware.ts';
import { CommandInput } from '../../../types/Command.ts';

describe('MediaRestrictionMiddleware', () => {
  const createTelegramInput = (messageData: any): CommandInput => ({
    platform: 'telegram',
    user: { id: 123, name: 'Test User' },
    args: [],
    raw: {
      message_id: 1,
      chat: { id: 456, type: 'private' },
      from: { id: 123, first_name: 'Test' },
      ...messageData,
    },
  });

  const createWhatsAppInput = (messageData: any): CommandInput => ({
    platform: 'whatsapp',
    user: { id: '123', name: 'Test User' },
    args: [],
    raw: {
      id: 'msg_123',
      from: '123',
      to: 'bot',
      timestamp: Date.now(),
      ...messageData,
    },
  });

  describe('Telegram Messages', () => {
    describe('Allowed Messages', () => {
      it('should allow text messages', async () => {
        const input = createTelegramInput({ text: 'Hello world' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).toBeNull();
      });
    });

    describe('Restricted Messages', () => {
      it('should restrict photo messages', async () => {
        const input = createTelegramInput({
          photo: [{ file_id: 'photo_123' }],
        });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
        expect(result?.text).toContain('📷 Imagens/Fotos');
        expect(result?.format).toBe('markdown');
      });

      it('should restrict video messages', async () => {
        const input = createTelegramInput({ video: { file_id: 'video_123' } });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
        expect(result?.text).toContain('🎥 Vídeos');
      });

      it('should restrict audio messages', async () => {
        const input = createTelegramInput({ audio: { file_id: 'audio_123' } });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('🎵 Áudios');
      });

      it('should restrict voice messages', async () => {
        const input = createTelegramInput({ voice: { file_id: 'voice_123' } });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('🔊 Mensagens de voz');
      });

      it('should restrict document messages', async () => {
        const input = createTelegramInput({ document: { file_id: 'doc_123' } });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('📁 Documentos');
      });

      it('should restrict location messages', async () => {
        const input = createTelegramInput({
          location: { latitude: 12.34, longitude: 56.78 },
        });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict contact messages', async () => {
        const input = createTelegramInput({
          contact: { phone_number: '+123456789', first_name: 'John' },
        });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict poll messages', async () => {
        const input = createTelegramInput({
          poll: { id: 'poll_123', question: 'Test poll?' },
        });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict unknown message types', async () => {
        const input = createTelegramInput({
          unknown_field: { data: 'some_data' },
        });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });
    });
  });

  describe('WhatsApp Messages', () => {
    describe('Allowed Messages', () => {
      it('should allow text messages', async () => {
        const input = createWhatsAppInput({ type: 'text', text: 'Hello' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).toBeNull();
      });
    });

    describe('Restricted Messages', () => {
      it('should restrict image messages', async () => {
        const input = createWhatsAppInput({ type: 'image' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict video messages', async () => {
        const input = createWhatsAppInput({ type: 'video' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict document messages', async () => {
        const input = createWhatsAppInput({ type: 'document' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict audio messages', async () => {
        const input = createWhatsAppInput({ type: 'audio' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict voice messages', async () => {
        const input = createWhatsAppInput({ type: 'voice' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict location messages', async () => {
        const input = createWhatsAppInput({ type: 'location' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict contact messages', async () => {
        const input = createWhatsAppInput({ type: 'contact' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });

      it('should restrict unknown message types', async () => {
        const input = createWhatsAppInput({ type: 'sticker' });
        const result =
          await MediaRestrictionMiddleware.checkMediaRestriction(input);

        expect(result).not.toBeNull();
        expect(result?.text).toContain('Apenas mensagens de texto');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing raw data gracefully', async () => {
      const input: CommandInput = {
        platform: 'telegram',
        args: [],
      };
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      expect(result).toBeNull();
    });

    it('should handle unknown platform gracefully', async () => {
      const input: CommandInput = {
        platform: 'unknown',
        args: [],
        raw: { some: 'data' },
      };
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      expect(result).toBeNull();
    });

    it('should handle malformed telegram message gracefully', async () => {
      const input: CommandInput = {
        platform: 'telegram',
        args: [],
        raw: { invalid: 'structure' },
      };
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      // Should return restriction message since malformed message is treated as OTHER type
      expect(result).not.toBeNull();
      expect(result?.text).toContain('Apenas mensagens de texto');
    });
  });

  describe('Message Content Validation', () => {
    it('should contain usage instructions', async () => {
      const input = createTelegramInput({ photo: [{ file_id: 'photo_123' }] });
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      expect(result?.text).toContain('Como usar o bot');
      expect(result?.text).toContain(
        'Digite comandos como /corridas ou /ajuda'
      );
    });

    it('should contain help reference', async () => {
      const input = createTelegramInput({ video: { file_id: 'video_123' } });
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      expect(result?.text).toContain('/ajuda');
      expect(result?.text).toContain('todos os comandos disponíveis');
    });

    it('should list all unsupported media types', async () => {
      const input = createTelegramInput({ voice: { file_id: 'voice_123' } });
      const result =
        await MediaRestrictionMiddleware.checkMediaRestriction(input);

      const expectedTypes = [
        '🔊 Mensagens de voz',
        '📷 Imagens/Fotos',
        '🎥 Vídeos',
        '📁 Documentos',
        '🎵 Áudios',
      ];

      expectedTypes.forEach(type => {
        expect(result?.text).toContain(type);
      });
    });
  });
});
