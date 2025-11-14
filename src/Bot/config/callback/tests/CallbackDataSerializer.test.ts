import { describe, it, expect } from 'vitest';
import { CallbackDataSerializer } from '../CallbackDataSerializer.ts';

describe('CallbackDataSerializer', () => {
  describe('Navigation Callbacks', () => {
    it('should serialize navigation within 64 bytes', () => {
      const data = {
        type: 'navigation' as const,
        action: 'back' as const,
        target: 'home',
      };
      const serialized = CallbackDataSerializer.serialize(data);

      expect(serialized).toBe('nav:back:home');
      expect(Buffer.byteLength(serialized, 'utf8')).toBeLessThanOrEqual(64);
    });

    it('should serialize navigation without target within 64 bytes', () => {
      const data = {
        type: 'navigation' as const,
        action: 'close' as const,
        target: '',
      };
      const serialized = CallbackDataSerializer.serialize(data);

      expect(serialized).toBe('nav:close:');
      expect(Buffer.byteLength(serialized, 'utf8')).toBeLessThanOrEqual(64);
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should correctly serialize and deserialize navigation', () => {
      const original = {
        type: 'navigation' as const,
        action: 'back' as const,
        target: 'home',
      };
      const serialized = CallbackDataSerializer.serialize(original);
      const deserialized = CallbackDataSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });

    it('should correctly serialize and deserialize navigation without target', () => {
      const original = {
        type: 'navigation' as const,
        action: 'next' as const,
        target: '',
      };
      const serialized = CallbackDataSerializer.serialize(original);
      const deserialized = CallbackDataSerializer.deserialize(serialized);

      expect(deserialized).toEqual(original);
    });
  });

  describe('Size Validation', () => {
    it('should validate that navigation callbacks are within 64 bytes', () => {
      const testCases = [
        {
          type: 'navigation' as const,
          action: 'back' as const,
          target: 'home',
        },
        {
          type: 'navigation' as const,
          action: 'next' as const,
          target: 'search',
        },
        {
          type: 'navigation' as const,
          action: 'close' as const,
          target: '',
        },
      ];

      testCases.forEach(testCase => {
        const serialized = CallbackDataSerializer.serialize(testCase);
        const size = Buffer.byteLength(serialized, 'utf8');

        expect(size).toBeLessThanOrEqual(64);
        expect(CallbackDataSerializer.validateSize(testCase)).toBe(true);
        expect(CallbackDataSerializer.getSize(testCase)).toBe(size);
      });
    });
  });

  describe('Helper Methods', () => {
    it('should create navigation callbacks via helper method', () => {
      const navCallback = CallbackDataSerializer.navigation('back', 'menu');
      expect(navCallback).toEqual({
        type: 'navigation',
        action: 'back',
        target: 'menu',
      });

      const navCallbackWithoutTarget =
        CallbackDataSerializer.navigation('close');
      expect(navCallbackWithoutTarget).toEqual({
        type: 'navigation',
        action: 'close',
        target: '',
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown callback type', () => {
      expect(() => {
        CallbackDataSerializer.deserialize('unknown:data');
      }).toThrow('Prefixo de callback não reconhecido: unknown');
    });

    it('should throw error for invalid serialized data', () => {
      expect(() => {
        CallbackDataSerializer.deserialize('invalid-data');
      }).toThrow('Prefixo de callback não reconhecido: invalid-data');
    });

    it('should throw error for unsupported callback type in serialize', () => {
      expect(() => {
        CallbackDataSerializer.serialize({
          type: 'unsupported' as any,
        });
      }).toThrow('Tipo de callback não suportado: unsupported');
    });
  });
});
