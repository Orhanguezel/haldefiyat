type Thing = Record<string, unknown>;

export function graph(items: Thing[]): Thing {
  return { '@context': 'https://schema.org', '@graph': items };
}

export function org(input: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: string;
  sameAs?: string[];
  '@id'?: string;
  foundingDate?: string;
  knowsAbout?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
}): Thing {
  return {
    '@type': 'Organization',
    ...(input['@id'] ? { '@id': input['@id'] } : {}),
    name: input.name,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.foundingDate ? { foundingDate: input.foundingDate } : {}),
    ...(input.knowsAbout?.length ? { knowsAbout: input.knowsAbout } : {}),
    ...(input.contactPoint
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: input.contactPoint.telephone,
            contactType: input.contactPoint.contactType,
            ...(input.contactPoint.availableLanguage?.length
              ? { availableLanguage: input.contactPoint.availableLanguage }
              : {}),
          },
        }
      : {}),
  };
}

export function website(input: {
  name: string;
  url: string;
  description?: string;
  searchAction?: {
    targetUrlTemplate: string;
    queryInput: string;
  };
}): Thing {
  return {
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.searchAction
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: input.searchAction.targetUrlTemplate,
            },
            'query-input': input.searchAction.queryInput,
          },
        }
      : {}),
  };
}

export function localBusiness(input: {
  name: string;
  url: string;
  description?: string;
  email?: string;
  telephone?: string;
  address?: string | {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: string;
  openingHoursSpecification?: {
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }[];
  sameAs?: string[];
}): Thing {
  const addressValue = input.address
    ? typeof input.address === 'string'
      ? input.address
      : { '@type': 'PostalAddress', ...input.address }
    : undefined;

  return {
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(addressValue ? { address: addressValue } : {}),
    ...(input.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: input.geo.latitude, longitude: input.geo.longitude } }
      : {}),
    ...(input.openingHours ? { openingHours: input.openingHours } : {}),
    ...(input.openingHoursSpecification?.length
      ? {
          openingHoursSpecification: input.openingHoursSpecification.map((spec) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: spec.dayOfWeek,
            opens: spec.opens,
            closes: spec.closes,
          })),
        }
      : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function product(input: {
  name: string;
  description?: string;
  image?: string;
  url?: string;
  brand?: string;
  category?: string;
  sku?: string;
  offers?: {
    priceCurrency?: string;
    price?: number | string;
    availability?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  manufacturer?: { '@id': string };
}): Thing {
  return {
    '@type': 'Product',
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.url ? { url: input.url } : {}),
    ...(input.brand
      ? { brand: { '@type': 'Brand', name: input.brand } }
      : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.offers
      ? {
          offers: {
            '@type': 'Offer',
            ...(input.offers.priceCurrency ? { priceCurrency: input.offers.priceCurrency } : {}),
            ...(input.offers.price != null ? { price: input.offers.price } : {}),
            availability: input.offers.availability || 'https://schema.org/InStock',
            seller: input.manufacturer,
          },
        }
      : {}),
    ...(input.aggregateRating && input.aggregateRating.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.aggregateRating.ratingValue,
            reviewCount: input.aggregateRating.reviewCount,
          },
        }
      : {}),
    ...(input.manufacturer ? { manufacturer: input.manufacturer } : {}),
  };
}

export function article(input: {
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}): Thing {
  return {
    '@type': 'Article',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.author
      ? { author: { '@type': 'Person', name: input.author } }
      : {}),
    ...(input.publisher
      ? {
          publisher: {
            '@type': 'Organization',
            name: input.publisher.name,
            ...(input.publisher.logo ? { logo: input.publisher.logo } : {}),
          },
        }
      : {}),
  };
}

export function breadcrumb(
  items: { name: string; url: string }[],
): Thing {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemList(
  items: { name: string; url: string }[],
): Thing {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function imageObject(input: {
  contentUrl: string;
  name?: string;
  caption?: string;
  width?: number;
  height?: number;
  dateModified?: string;
}): Thing {
  return {
    '@type': 'ImageObject',
    contentUrl: input.contentUrl,
    ...(input.name ? { name: input.name } : {}),
    ...(input.caption ? { caption: input.caption } : {}),
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

export function imageGallery(input: {
  name: string;
  description?: string;
  url: string;
  images: Thing[];
}): Thing {
  return {
    '@type': 'ImageGallery',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    hasPart: input.images,
  };
}

export function collectionPage(input: {
  name: string;
  description?: string;
  url: string;
  mainEntity?: Thing;
}): Thing {
  return {
    '@type': 'CollectionPage',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.mainEntity ? { mainEntity: input.mainEntity } : {}),
  };
}

export function service(input: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  provider?: string;
}): Thing {
  return {
    '@type': 'Service',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.provider ? { provider: { '@type': 'Organization', name: input.provider } } : {}),
  };
}

export function faqPage(
  questions: { question: string; answer: string }[],
): Thing {
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function newsArticle(input: {
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  publisher?: {
    name: string;
    logo?: string;
  };
}): Thing {
  return {
    '@type': 'NewsArticle',
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.author
      ? { author: { '@type': 'Person', name: input.author } }
      : {}),
    ...(input.publisher
      ? {
          publisher: {
            '@type': 'Organization',
            name: input.publisher.name,
            ...(input.publisher.logo ? { logo: input.publisher.logo } : {}),
          },
        }
      : {}),
  };
}

export function creativeWork(input: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  dateCreated?: string;
  locationCreated?: string;
}): Thing {
  return {
    '@type': 'CreativeWork',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.dateCreated ? { dateCreated: input.dateCreated } : {}),
    ...(input.locationCreated ? { locationCreated: { '@type': 'Place', name: input.locationCreated } } : {}),
  };
}
