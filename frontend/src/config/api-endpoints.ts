const V1 = "/api/v1";

export const API = {
  products: {
    list:       `${V1}/products`,
    compare:    `${V1}/products/compare`,
    detail:     (slug: string) => `${V1}/products/${slug}`,
    categories: `${V1}/categories`,
    specs:      `${V1}/product_specs`,
    reviews:    `${V1}/product_reviews`,
    faqs:       `${V1}/product_faqs`,
    faqSubmit:  `${V1}/product_faqs/submit`,
    reviewSubmit: `${V1}/product_reviews/submit`,
  },

  siteSettings: {
    public:  `${V1}/site-settings/public`,
    seoPage: (pageKey: string) => `${V1}/site-settings/seo/${pageKey}`,
  },

  contacts: {
    create: `${V1}/contacts`,
  },

  customPages: {
    list:   `${V1}/custom-pages`,
    detail: (id: string) => `${V1}/custom-pages/${id}`,
    bySlug: (slug: string) => `${V1}/custom-pages/by-slug/${slug}`,
  },

  orders: {
    list:   `${V1}/orders`,
    detail: (id: string) => `${V1}/orders/${id}`,
    create: `${V1}/orders`,
    cancel: (id: string) => `${V1}/orders/${id}/cancel`,
    paymentCardInit: (id: string) => `${V1}/orders/${encodeURIComponent(id)}/payment/card/initiate`,
    paymentIyzicoInit: (id: string) => `${V1}/orders/${encodeURIComponent(id)}/payment/iyzico/initiate`,
    paymentBankTransfer: (id: string) => `${V1}/orders/${encodeURIComponent(id)}/payment/bank-transfer`,
    paymentCredit: (id: string) => `${V1}/orders/${encodeURIComponent(id)}/payment/credit`,
  },

  dealer: {
    profile:      `${V1}/dealer/profile`,
    balance:      `${V1}/dealer/balance`,
    transactions: `${V1}/dealer/transactions`,
    catalog:      `${V1}/dealer/products`,
  },

  dealers: {
    public: `${V1}/dealers/public`,
  },

  support: {
    faqs:    `${V1}/support/faqs`,
    tickets: `${V1}/support/tickets`,
    myTickets: `${V1}/support/tickets/my`,
    ticketMessages: (ticketId: string) => `${V1}/support/tickets/${ticketId}/messages`,
  },

  home: {
    summary: `${V1}/home/summary`,
  },

  blog: {
    list: `${V1}/blog`,
    detail: (slug: string) => `${V1}/blog/${encodeURIComponent(slug)}`,
    rss: `${V1}/feed/rss`,
  },

  references: {
    list: `${V1}/references`,
    /** Slug ile detay — backend: GET /references/by-slug/:slug */
    bySlug: (slug: string) => `${V1}/references/by-slug/${encodeURIComponent(slug)}`,
    byId: (id: string) => `${V1}/references/${encodeURIComponent(id)}`,
  },

  library: {
    list: `${V1}/library`,
    detail: (id: string) => `${V1}/library/${encodeURIComponent(id)}`,
    bySlug: (slug: string) => `${V1}/library/by-slug/${encodeURIComponent(slug)}`,
    files: (id: string) => `${V1}/library/${encodeURIComponent(id)}/files`,
    images: (id: string) => `${V1}/library/${encodeURIComponent(id)}/images`,
  },
  
  offers: {
    publicCreate: `${V1}/offers/public`,
  },
} as const;

export const API_ENDPOINTS = API;
