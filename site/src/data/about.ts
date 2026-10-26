/** The About page's copy, shared with llms-full.txt. */
interface Card {
  title: string;
  text: string;
  /** The card's fill on the page. */
  style?: string;
}

/** "Top software. With a human behind it." */
export const mission: Card[] = [
  {
    title: 'For anyone',
    text: 'Individuals, local businesses, charities and growing teams. Big-agency standards without the big-agency distance.',
    style: 'lilac',
  },
  {
    title: 'The human touch',
    text: 'The person you speak to on day one knows your project inside out.',
    style: 'dusk',
  },
  {
    title: 'Care after launch',
    text: 'Questions, fixes and changes handled by someone who picks up.',
    style: 'rose',
  },
];

/** "Four rules we build by." */
export const rules: Card[] = [
  {
    title: 'Human first',
    text: 'Technology serves people. Not the other way round.',
    style: 'ink',
  },
  {
    title: 'Built properly',
    text: 'Fast, secure and tested. Never one prompt and done.',
    style: 'arch',
  },
  {
    title: 'Honest',
    text: 'Straight answers, clear prices, no promises we can’t keep.',
    style: 'lilac',
  },
  { title: 'Here after launch', text: 'We don’t take the money and disappear.', style: 'outline' },
];

/** "If we get it wrong, we put it right." Commitments from the design (2026-10-25): Gurman to
 * confirm each one before launch, and mirror them in the contract terms. */
export const promises: Card[] = [
  {
    title: 'We fix our mistakes',
    text: 'If something breaks because of our work, we fix it at no cost to you.',
  },
  {
    title: 'A real person answers',
    text: 'Message us and a person who knows your site replies. No ticket bots.',
  },
  {
    title: 'No charge for every little thing',
    text: 'Quick questions and small fixes are part of the service, not a new invoice.',
  },
  { title: 'We don’t disappear', text: 'Launch is the start. We are still here when you need us.' },
  { title: 'You own it', text: 'Your code, your content, your domain. No lock-in.' },
  {
    title: 'Straight talk',
    text: 'No one can guarantee a place in AI answers. We tell you what we can and can’t do.',
  },
];
