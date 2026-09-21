/**
 * Scripted chat demo content, verbatim from docs/03-site-spec.md. No
 * network calls — every reply is fixed. Do not add real business data.
 */
export interface ChatExchange {
  chip: string;
  reply: string;
}

export const chatExchanges: ChatExchange[] = [
  {
    chip: 'Do you take walk-ins?',
    reply:
      "Yes, when there's a free chair. Booking online guarantees your slot: the next free chair is today at 4:30 pm. Want me to hold it?",
  },
  {
    chip: 'How much is a skin fade?',
    reply: 'A skin fade is £18. Adding a beard sculpt makes it £28 for both.',
  },
  {
    chip: 'Can I book Saturday morning?',
    reply:
      "Saturday has 9:30 am and 11:00 am free. Tell me your name and I'll pass your request to the shop to confirm.",
  },
  {
    chip: 'Speak to a person',
    reply:
      "Of course. I've sent your question to the team with a note of what you asked. They usually reply within the hour during opening times.",
  },
];

export const chatGreeting =
  "Hi! I'm the enquiry assistant for Northgate Barbers (demo). Ask me about walk-ins, prices or booking.";
