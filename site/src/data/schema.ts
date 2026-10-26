/**
 * The schema.org JSON-LD for each page, as one linked @graph. Every page carries the business,
 * the website, the page itself and its breadcrumb, joined by @id, so search engines and AI tools
 * read one consistent entity wherever they land. Pages then add what they are about: the service
 * catalogue, the priced tiers and FAQ, the build stages, or the projects.
 *
 * Rule: the schema only states what the visible page states (Google's structured data policy,
 * and the hard rule on proof). No ratings, reviews or awards until real ones exist.
 */
import { site } from '../config/site';
import { pages, type PageKey } from './pages';
import { serviceAreas } from './services';
import { tiers } from './pricing';
import { faq, agenticFaq, checkFaq } from './faq';
import { term, definition } from './agentic';
import { stages } from './process';
import { projects } from './projects';
import { lastModified, pageFile } from '../lib/lastModified';

type Node = Record<string, unknown>;

/** Absolute URL for a root-relative path, respecting any base path. */
export type AbsUrl = (path: string) => string;

/** "£1,195" -> "1195"; "POA" -> undefined. */
const amount = (price: string): string | undefined => {
  const digits = price.replace(/[^\d.]/g, '');
  return digits ? digits : undefined;
};

/** What the studio knows about, for `knowsAbout` (each is a service on the site). */
const knowsAbout = [
  'Website design',
  'Web development',
  'E-commerce websites',
  'Mobile app development',
  'Custom software development',
  'Branding and graphic design',
  'Search engine optimisation (SEO)',
  'Local SEO',
  'Generative engine optimisation (GEO)',
  'Agentic AI-ready websites',
  'Structured data',
  'Web accessibility',
  'Website security',
  'Web hosting',
];

export function buildSchema(key: PageKey, abs: AbsUrl): Node {
  const page = pages[key];
  const url = abs(page.path);
  const ids = {
    org: abs('/#organization'),
    website: abs('/#website'),
    logo: abs('/#logo'),
    page: `${url}#webpage`,
    breadcrumb: `${url}#breadcrumb`,
    services: abs('/services/#services'),
    tiers: abs('/pricing/#tiers'),
  };
  const image = abs(`/og/${page.noindex ? 'index' : key}.png`);

  const organization: Node = {
    '@type': 'ProfessionalService',
    '@id': ids.org,
    name: site.fullName,
    alternateName: site.alternateNames,
    url: abs('/'),
    logo: {
      '@type': 'ImageObject',
      '@id': ids.logo,
      url: abs('/logo.png'),
      contentUrl: abs('/logo.png'),
      width: 512,
      height: 512,
      caption: site.fullName,
    },
    image: abs('/og/index.png'),
    description:
      'A software studio in Leeds, West Yorkshire, building websites, e-commerce stores, mobile apps and custom software for individuals and small businesses. Every site is fast, secure and agentic AI-ready, and a real person supports it after launch.',
    slogan: 'Made by hand. Built by machine.',
    foundingDate: site.founded,
    email: site.contact.email,
    telephone: `+${site.contact.phoneIntl}`,
    // A service-area business: town and region only, never a street address.
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.town,
      addressRegion: site.location.region,
      addressCountry: site.location.country,
    },
    areaServed: [
      ...site.areasServed.map((name) => ({ '@type': 'City', name })),
      { '@type': 'AdministrativeArea', name: 'West Yorkshire' },
      { '@type': 'Country', name: 'United Kingdom' },
    ],
    priceRange: `${tiers[0].price}–${tiers.filter((t) => amount(t.price)).at(-1)!.price}`,
    currenciesAccepted: 'GBP',
    knowsAbout,
    knowsLanguage: 'en-GB',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: site.contact.email,
      telephone: `+${site.contact.phoneIntl}`,
      areaServed: 'GB',
      availableLanguage: 'English',
    },
    sameAs: [site.contact.instagram],
    hasOfferCatalog: { '@id': ids.services },
    // The enquiry form's endpoint, described so an AI agent can send an enquiry for someone.
    potentialAction: {
      '@type': 'CommunicateAction',
      name: 'Send an enquiry',
      description:
        'POST name, email and message (and optionally topic, website, phone, tier) as JSON or form data. GET the same URL for the field list.',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs('/api/enquiry'),
        httpMethod: 'POST',
        contentType: ['application/json', 'application/x-www-form-urlencoded'],
      },
      recipient: { '@id': ids.org },
    },
  };

  const website: Node = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: abs('/'),
    name: site.fullName,
    alternateName: site.alternateNames,
    description: pages.index.description,
    inLanguage: 'en-GB',
    publisher: { '@id': ids.org },
  };

  const dateModified = lastModified(pageFile(key));
  const webPage: Node = {
    '@type': page.schemaType,
    '@id': ids.page,
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.org },
    publisher: { '@id': ids.org },
    primaryImageOfPage: { '@type': 'ImageObject', url: image, width: 1200, height: 630 },
    ...(dateModified && { dateModified }),
    ...(key !== 'index' && { breadcrumb: { '@id': ids.breadcrumb } }),
  };

  const graph: Node[] = [organization, website, webPage];

  if (key !== 'index') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': ids.breadcrumb,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: pages.index.label, item: abs('/') },
        { '@type': 'ListItem', position: 2, name: page.label, item: url },
      ],
    });
  }

  // The service catalogue: on the home page (it lists the six areas) and the services page.
  if (key === 'index' || key === 'services') {
    graph.push({
      '@type': 'OfferCatalog',
      '@id': ids.services,
      name: 'Services',
      url: abs('/services/'),
      itemListElement: serviceAreas.map((area) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: area.title.replace(/\s\+\s/g, ' and '),
          description: `${area.short} ${area.items.map((item) => item.text).join('; ')}.`,
          serviceType: area.title.replace(/\s\+\s/g, ' and '),
          provider: { '@id': ids.org },
          areaServed: { '@type': 'Country', name: 'United Kingdom' },
        },
      })),
    });
  }

  if (key === 'pricing') {
    graph.push({
      '@type': 'OfferCatalog',
      '@id': ids.tiers,
      name: 'Website tiers',
      url,
      itemListElement: tiers.map((tier) => {
        const price = amount(tier.price);
        return {
          '@type': 'Offer',
          name: tier.name,
          description: tier.includes,
          url: `${url}#tiers-title`,
          seller: { '@id': ids.org },
          ...(price
            ? { price, priceCurrency: 'GBP' }
            : {
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  description: 'Price on application',
                },
              }),
          itemOffered: {
            '@type': 'Service',
            name: `${tier.name}: ${tier.short}`,
            provider: { '@id': ids.org },
          },
        };
      }),
    });
    webPage.mainEntity = faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }));
  }

  if (key === 'how-we-build') {
    webPage.mainEntity = {
      '@type': 'ItemList',
      name: 'Six stages. A human signs off each one.',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: stages.map((stage, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: stage.title.replace(/\s\+\s/g, ' and '),
        description: stage.text,
      })),
    };
  }

  if (key === 'about' || key === 'contact') {
    webPage.mainEntity = { '@id': ids.org };
  }

  const questions = (list: typeof faq) =>
    list.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    }));

  if (key === 'agentic-ai-ready') {
    graph.push({
      '@type': 'DefinedTerm',
      '@id': `${url}#term`,
      name: term,
      alternateName: ['Agentic AI-ready', 'AI-ready website'],
      description: definition,
      url,
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: `${site.fullName} glossary`, url },
    });
    webPage.about = [{ '@id': `${url}#term` }, { '@id': ids.org }];
    webPage.mainEntity = questions(agenticFaq);
  }

  if (key === 'free-ai-check') {
    graph.push({
      '@type': 'Service',
      '@id': `${url}#service`,
      name: 'Free AI check',
      serviceType: 'AI visibility audit',
      description:
        'A free check, done by a person, of whether ChatGPT, Perplexity, Gemini, Claude, Copilot and Google’s AI Overviews recommend a business, with a list of what to fix. Reply within 48 hours.',
      provider: { '@id': ids.org },
      areaServed: { '@type': 'Country', name: 'United Kingdom' },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
        description: 'Free, no obligation.',
        url,
      },
    });
    webPage.mainEntity = questions(checkFaq);
  }

  if (key === 'work') {
    webPage.mainEntity = {
      '@type': 'ItemList',
      itemListElement: projects.map((project, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': project.live ? 'WebSite' : 'CreativeWork',
          name: project.name,
          description: project.summary,
          creator: { '@id': ids.org },
          ...(project.url && { url: project.url }),
          ...(!project.live && { creativeWorkStatus: 'Concept, not live' }),
        },
      })),
    };
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
