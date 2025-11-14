import {
  CallbackData,
  NavigationCallbackData,
  UfFilterCallbackData,
} from '../../../types/callbacks/index.ts';

export class CallbackDataSerializer {
  static serialize(data: CallbackData): string {
    switch (data.type) {
      case 'navigation': {
        const navData = data as NavigationCallbackData;
        return `nav:${navData.action}:${navData.target || ''}`;
      }
      case 'uf_filter': {
        const filterData = data as UfFilterCallbackData;
        return `uf:${filterData.uf}`;
      }
      default: {
        const unknownData = data as { type: string };
        throw new Error(`Tipo de callback não suportado: ${unknownData.type}`);
      }
    }
  }

  static deserialize(serialized: string): CallbackData {
    const parts = serialized.split(':');
    const prefix = parts[0];

    switch (prefix) {
      case 'nav': {
        return {
          type: 'navigation',
          action: parts[1] as 'back' | 'next' | 'close',
          target: parts[2] || '',
        } as NavigationCallbackData;
      }
      case 'uf': {
        return {
          type: 'uf_filter',
          uf: parts[1] as 'SP' | 'PR',
        } as UfFilterCallbackData;
      }
      default:
        throw new Error(`Prefixo de callback não reconhecido: ${prefix}`);
    }
  }

  static validateSize(data: CallbackData): boolean {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8') <= 64;
  }

  static getSize(data: CallbackData): number {
    const serialized = this.serialize(data);
    return Buffer.byteLength(serialized, 'utf8');
  }

  static navigation(
    action: 'back' | 'next' | 'close',
    target?: string
  ): NavigationCallbackData {
    return { type: 'navigation', action, target: target || '' };
  }

  static ufFilter(uf: 'SP' | 'PR'): UfFilterCallbackData {
    return { type: 'uf_filter', uf };
  }
}
