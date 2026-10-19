/**
 * Credentials, kept for reuse. Not shown on the site: the agency site has no personal section
 * (Gurman, 2026-09-27 and 2026-10-19). Page copy now lives in the page components.
 */
export interface Credential {
  text: string;
  inProgress?: boolean;
}

/** Not shown on the site since the About section was removed (2026-09-27); kept for reuse. */
export const credentials: Credential[] = [
  { text: 'T Level in Digital Production, Design and Development (Pass), Calderdale College' },
  {
    text: 'Industry placement, Lloyds Banking Group, 2024: built and shipped two live mortgage web pages with TypeScript and React inside Agile sprints',
  },
  { text: 'CS50x: Introduction to Computer Science, Harvard University (edX), completed' },
  { text: 'PCEP: Python Certified Entry-Level Programmer (active)' },
  {
    text: 'Open source: macOS/Apple Silicon setup section for Arm\'s "AI Agent on CPU" Learning Path, submitted as a pull request',
  },
  {
    text: 'FinBERT financial sentiment analysis (2025): fine-tuned BERT-based model with Hugging Face and PyTorch',
  },
  {
    text: 'Spring Boot REST API test-automation project (2026): CRUD service with MongoDB, Docker, automated API tests, CI in Azure DevOps and GitHub Actions',
  },
  { text: 'Essence Hair Treatment website (2026): live React website built for a family business' },
  { text: 'Claude Certified Architect, Foundations', inProgress: true },
  { text: 'AWS Cloud Practitioner Essentials (self-study)', inProgress: true },
  { text: 'Azure DevOps for CI/CD (self-study)', inProgress: true },
  { text: 'C++ Foundations (Udemy)' },
  { text: 'COBOL Basics (IBM, 2026)' },
];
