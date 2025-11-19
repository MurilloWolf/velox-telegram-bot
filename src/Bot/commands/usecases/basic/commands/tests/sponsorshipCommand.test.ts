import { describe, it, expect } from 'vitest';
import { sponsorshipCommand } from '../sponsorshipCommand.ts';
import { CommandInput } from '../../../../../../types/Command.ts';

describe('SponsorshipCommand', () => {
  const createBasicInput = (platform: string): CommandInput => ({
    platform,
    args: [],
    raw: {},
  });

  describe('Success Cases', () => {
    it('should return sponsorship information', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain('Programa de Patrocínio VELOX');
      expect(result.format).toBe('markdown');
    });

    it('should contain why sponsor section', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain('Por que patrocinar a VELOX');
      expect(result.text).toContain('comunidade ativa de corredores');
      expect(result.text).toContain('plataforma em crescimento');
      expect(result.text).toContain('estilo de vida saudável');
      expect(result.text).toContain('Único bot de corridas do Brasil');
    });

    it('should contain user base information', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain('Nossa Base');
      expect(result.text).toContain('usuários ativos');
      expect(result.text).toContain('Crescimento orgânico constante');
      expect(result.text).toContain('Engajamento alto da comunidade');
    });

    it('should contain important links', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain('Links Importantes');
      expect(result.text).toContain('https://www.veloxrunning.com');
      expect(result.text).toContain('https://instagram.com/runningvelox');
      expect(result.text).toContain('https://twitter.com/RunningVelox');
    });

    it('should contain contact information', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain('Entre em contato');
      expect(result.text).toContain('velox.running.app@gmail.com');
      expect(result.text).toContain('+55 18 99770-8504');
    });

    it('should contain motivational message', async () => {
      const input = createBasicInput('telegram');
      const result = await sponsorshipCommand(input);

      expect(result.text).toContain(
        'Vamos construir o futuro da corrida juntos'
      );
    });
  });

  describe('Platform Independence', () => {
    it('should work for any platform', async () => {
      const platforms = ['telegram', 'whatsapp', 'unknown'];

      for (const platform of platforms) {
        const input = createBasicInput(platform);
        const result = await sponsorshipCommand(input);

        expect(result.text).toContain('Programa de Patrocínio VELOX');
        expect(result.text).toContain('velox.running.app@gmail.com');
        expect(result.format).toBe('markdown');
      }
    });
  });
});
