import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { hash as argonHash } from 'argon2';
import {
  handleRouteError,
  sendValidationError,
} from '../_shared';
import { repoGetUserByEmail } from '../auth/repository';
import { users } from '../auth/schema';
import { userRoles } from '../userRoles/schema';
import { profiles } from '../profiles/schema';
import { telegramNotify } from '../telegram';
import { db } from '../../db/client';
import { dealerProfiles, dealerPublicRegisterSchema } from '@agro/shared-backend/modules/dealerFinance';

export async function registerDealerPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = dealerPublicRegisterSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const {
      email,
      password,
      full_name,
      phone,
      company_name,
      tax_number,
      tax_office,
      city,
      region,
    } = parsed.data;

    const emailNorm = email.trim().toLowerCase();
    const existing = await repoGetUserByEmail(emailNorm);
    if (existing) {
      return reply.code(409).send({ error: { message: 'user_exists' } });
    }

    const userId = randomUUID();
    const profileId = randomUUID();
    const roleRowId = randomUUID();
    const password_hash = await argonHash(password);

    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: userId,
        email: emailNorm,
        password_hash,
        full_name,
        phone,
        is_active: 1,
        email_verified: 0,
        rules_accepted_at: new Date(),
      });

      await tx.insert(userRoles).values({
        id: roleRowId,
        user_id: userId,
        role: 'dealer',
      });

      await tx.insert(profiles).values({
        id: userId,
        full_name,
        phone,
        city: city?.trim() || null,
        country: null,
      });

      await tx.insert(dealerProfiles).values({
        id: profileId,
        user_id: userId,
        company_name,
        tax_number,
        tax_office,
        city: city?.trim() || null,
        region: region?.trim() || null,
        is_approved: 0,
        list_public: 0,
      });
    });

    void telegramNotify({
      title: 'Bayi basvurusu',
      message: `${company_name} — ${emailNorm} — ${full_name}`,
    }).catch((err) => req.log?.warn?.({ err }, 'dealer_register_telegram_failed'));

    return reply.code(201).send({
      success: true,
      message: 'dealer_registration_pending',
    });
  } catch (e) {
    return handleRouteError(reply, req, e, 'dealer_public_register');
  }
}
