import type { FastifyInstance, FastifyRequest } from "fastify";

type PageviewBody = {
  path: string;
  referer?: string;
};

type RequestWithAuditPageview = FastifyRequest & {
  auditPageview?: {
    url: string;
    path: string;
    referer: string | null;
  };
};

function normalizePath(value: string): { url: string; path: string } {
  const raw = value.trim().slice(0, 2048);
  const parsed = new URL(raw || "/", "https://haldefiyat.com");
  const path = parsed.pathname || "/";
  return {
    url: `${path}${parsed.search}`,
    path,
  };
}

export async function registerTracking(app: FastifyInstance) {
  app.post<{ Body: PageviewBody }>("/track/pageview", {
    schema: {
      body: {
        type: "object",
        required: ["path"],
        properties: {
          path: { type: "string", minLength: 1, maxLength: 2048 },
          referer: { type: "string", maxLength: 2048 },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const { url, path } = normalizePath(req.body.path);
    (req as RequestWithAuditPageview).auditPageview = {
      url,
      path,
      referer: req.body.referer?.trim().slice(0, 2048) || null,
    };

    return reply.code(204).send();
  });
}
