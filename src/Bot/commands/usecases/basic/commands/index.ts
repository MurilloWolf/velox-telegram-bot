import { startCommand } from './startCommand.ts';
import { helpCommand } from './helpCommand.ts';
import { contactCommand } from './contactCommand.ts';
import { aboutCommand } from './aboutCommand.ts';
import { sponsorshipCommand } from './sponsorshipCommand.ts';

export const commands = {
  start: startCommand,
  ajuda: helpCommand,
  help: helpCommand,
  contato: contactCommand,
  contact: contactCommand,
  sobre: aboutCommand,
  about: aboutCommand,
  patrocinio: sponsorshipCommand,
  sponsorship: sponsorshipCommand,
};

export * from './startCommand.ts';
export * from './helpCommand.ts';
export * from './contactCommand.ts';
export * from './aboutCommand.ts';
export * from './sponsorshipCommand.ts';
