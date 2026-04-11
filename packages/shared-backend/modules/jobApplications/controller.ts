// src/modules/jobApplications/controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { jobApplicationCreateSchema } from './validation';
import { repoCreateApplication } from './repository';
import { handleRouteError } from '@agro/shared-backend/modules/_shared';

export const submitApplication: RouteHandler = async (req, reply) => {
  try {
    const input = jobApplicationCreateSchema.parse(req.body ?? {});
    const id = randomUUID();
    await repoCreateApplication(id, input);
    return reply.status(201).send({ ok: true, id });
  } catch (err) {
    return handleRouteError(reply, req, err, 'submit_application_error');
  }
};
