/**
 * Scripted chat demo. No network calls. Chips can be clicked more than
 * once; each click appends a new user message and (after a typing delay)
 * the fixed assistant reply. New messages are announced via aria-live.
 */
const TYPING_DELAY_MS = 700;

export function initChatDemo(): void {
  const root = document.querySelector<HTMLElement>('[data-chat-demo]');
  if (!root) return;

  const log = root.querySelector<HTMLElement>('[data-chat-log]');
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-chat-chip]'));
  const typingIndicator = root.querySelector<HTMLElement>('[data-chat-typing]');
  if (!log || !typingIndicator) return;

  function appendMessage(text: string, from: 'user' | 'assistant'): void {
    const message = document.createElement('p');
    message.className = `chat__msg chat__msg--${from}`;
    message.textContent = text;
    log!.appendChild(message);
    log!.scrollTop = log!.scrollHeight;
  }

  function handleChip(chip: HTMLButtonElement): void {
    const question = chip.dataset.chatChip;
    const reply = chip.dataset.chatReply;
    if (!question || !reply) return;

    appendMessage(question, 'user');

    typingIndicator!.hidden = false;
    window.setTimeout(() => {
      typingIndicator!.hidden = true;
      appendMessage(reply, 'assistant');
    }, TYPING_DELAY_MS);
  }

  for (const chip of chips) {
    chip.addEventListener('click', () => handleChip(chip));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatDemo);
} else {
  initChatDemo();
}
