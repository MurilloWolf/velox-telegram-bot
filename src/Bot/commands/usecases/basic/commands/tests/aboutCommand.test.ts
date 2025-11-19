import { describe, it, expect } from 'vitest';
import { aboutCommand } from '../aboutCommand.ts';
import { CommandInput } from '../../../../../../types/Command.ts';

describe('AboutCommand', () => {
  const createBasicInput = (platform: string): CommandInput => ({
    platform,
    args: [],
    raw: {},
  });

  describe('Success Cases', () => {
    it('should return about information', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Sobre a VELOX');
      expect(result.format).toBe('markdown');
    });

    it('should contain mission information', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Nossa Missão');
      expect(result.text).toContain('Conectar corredores');
      expect(result.text).toContain('melhores provas de corrida');
    });

    it('should contain bot information', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Sobre o Bot');
      expect(result.text).toContain('companheiro inteligente');
      expect(result.text).toContain('descobrir corridas');
    });

    it('should contain official links', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Links Oficiais');
      expect(result.text).toContain('https://www.veloxrunning.com');
      expect(result.text).toContain('https://instagram.com/runningvelox');
      expect(result.text).toContain('https://twitter.com/RunningVelox');
      expect(result.text).toContain('@veloxsupport');
    });

    it('should contain platform features', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Plataforma Completa');
      expect(result.text).toContain('Calendário de eventos');
      expect(result.text).toContain('Sistema de alertas');
      expect(result.text).toContain('Comunidade ativa');
      expect(result.text).toContain('Planilhas de treino');
    });

    it('should contain community invitation', async () => {
      const input = createBasicInput('telegram');
      const result = await aboutCommand(input);

      expect(result.text).toContain('Junte-se à nossa comunidade');
    });
  });

  describe('Platform Independence', () => {
    it('should work for any platform', async () => {
      const platforms = ['telegram', 'whatsapp', 'unknown'];

      for (const platform of platforms) {
        const input = createBasicInput(platform);
        const result = await aboutCommand(input);

        expect(result.text).toContain('Sobre a VELOX');
        expect(result.text).toContain('Nossa Missão');
        expect(result.format).toBe('markdown');
      }
    });
  });
});
