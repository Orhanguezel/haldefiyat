// src/modules/wallet/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from '../../db/client';
import { wallets, walletTransactions } from "./schema";
import { users } from "@agro/shared-backend/modules/auth/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { depositSchema, initiateDepositSchema } from "./validation";
import { getAuthUserId, handleRouteError } from "@agro/shared-backend/modules/_shared";
import { env } from '../../core/env';
import { createCheckoutForm, retrieveCheckoutForm } from "./iyzico";
import { createPayTRToken, encodePayTRBasket, verifyPayTRCallback } from "./paytr";
import { sendDepositSuccessMail } from "../mail-api/service";
import { getOrCreateWallet, parseWalletPaging, invalidateWalletCachesForUsers } from './helpers';

const siteLabel = () => env.SITE_NAME || "Site";

/** GET /wallet — get current user's wallet info */
export const getMyWallet: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const wallet = await getOrCreateWallet(userId);
    return reply.send(wallet);
  } catch (e) {
    return handleRouteError(reply, req, e, "wallet_get_error");
  }
};

/** GET /wallet/transactions — list current user's transactions */
export const listMyTransactions: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const wallet = await getOrCreateWallet(userId);

    const q = req.query as Record<string, string>;
    const { page: pageNum, limit: limitNum, offset } = parseWalletPaging(q);

    const conditions: ReturnType<typeof eq>[] = [eq(walletTransactions.wallet_id, wallet.id)];
    if (q.type) conditions.push(eq(walletTransactions.type, q.type as "credit" | "debit"));
    if (q.purpose) conditions.push(eq(walletTransactions.purpose, q.purpose));

    const where = and(...conditions);

    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(walletTransactions)
        .where(where)
        .orderBy(desc(walletTransactions.created_at))
        .limit(limitNum)
        .offset(offset),
      db.select({ total: sql<number>`COUNT(*)` }).from(walletTransactions).where(where),
    ]);

    return reply.send({ data: rows, page: pageNum, limit: limitNum, total: Number(countRow?.total ?? 0) });
  } catch (e) {
    return handleRouteError(reply, req, e, "wallet_transactions_error");
  }
};

// ── İyzico: ödeme başlat ──────────────────────────────────────────────────────

/** POST /wallet/deposit/initiate — İyzico checkout form başlat */
export const initiateDeposit: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const { amount, provider } = initiateDepositSchema.parse(req.body);

    // Kullanıcı bilgilerini çek (buyer için gerekli)
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return reply.code(404).send({ error: { message: "user_not_found" } });

    const wallet = await getOrCreateWallet(userId);

    const conversationId = randomUUID();
    const amountStr = amount.toFixed(2);
    const nameParts = (user.full_name ?? "Kullanıcı").trim().split(" ");
    const firstName = nameParts[0] ?? siteLabel();
    const lastName = nameParts.slice(1).join(" ") || "Kullanıcı";

    // IPv4 normalize — İyzico IPv6 kabul etmiyor
    const rawIp = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.ip ?? "127.0.0.1";
    const buyerIp = rawIp === "::1" || rawIp === "::ffff:127.0.0.1" ? "127.0.0.1" : rawIp;

    // Pending transaction kaydı aç
    const txId = randomUUID();
    await db.insert(walletTransactions).values({
      id: txId,
      wallet_id: wallet.id,
      user_id: userId,
      type: "credit",
      amount: amountStr,
      purpose: "deposit",
      description: `₺${amountStr} bakiye yükleme (İyzico)`,
      payment_status: "pending",
      transaction_ref: conversationId,
    });

    const callbackUrl = `${env.PUBLIC_URL}/api/v1/wallet/deposit/callback`;
    const frontendUrl = env.FRONTEND_URL;

    // --- CASE: PayTR ---
    if (provider === "paytr") {
      const kurusAmount = Math.round(amount * 100);
      const basket = encodePayTRBasket([
        [`${siteLabel()} Bakiye Yükleme`, amount.toFixed(2), 1]
      ]);

      const paytrRes = await createPayTRToken({
        merchant_oid: conversationId,
        email: user.email,
        payment_amount: kurusAmount,
        user_ip: buyerIp,
        user_basket: basket,
        user_name: `${firstName} ${lastName}`,
        user_address: "Türkiye",
        user_phone: user.phone || "05550000000",
        merchant_ok_url: `${frontendUrl}/panel/cuzdan/odeme-sonuc?status=success&amount=${encodeURIComponent(amountStr)}`,
        merchant_fail_url: `${frontendUrl}/panel/cuzdan/odeme-sonuc?status=fail`,
        merchant_notify_url: `${env.PUBLIC_URL}/api/v1/wallet/deposit/paytr-callback`,
        currency: "TL",
      });

      return reply.send({
        provider: "paytr",
        token: paytrRes.token,
        iframeUrl: paytrRes.iframe_url,
        conversationId,
        amount,
      });
    }

    // --- CASE: Iyzico ---
    const iyzicoReq = {
      locale: "tr",
      conversationId,
      price: amountStr,
      paidPrice: amountStr,
      currency: "TRY",
      basketId: `wallet-${wallet.id}`,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: userId,
        name: firstName,
        surname: lastName,
        email: user.email,
        identityNumber: "11111111111", // sandbox; prod'da gerçek TC gerekir
        registrationAddress: "Türkiye",
        city: "Istanbul",
        country: "Turkey",
        ip: buyerIp,
      },
      shippingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      billingAddress: {
        contactName: `${firstName} ${lastName}`,
        city: "Istanbul",
        country: "Turkey",
        address: "Türkiye",
      },
      basketItems: [
        {
          id: txId,
          name: `${siteLabel()} Bakiye Yükleme`,
          category1: "Dijital",
          itemType: "VIRTUAL" as const,
          price: amountStr,
          // Bakiye yuklemede marketplace yok — sub-merchant alanlari gonderilmez
        },
      ],
    };

    const iyzicoRes = await createCheckoutForm(iyzicoReq);

    if (iyzicoRes.status !== "success" || !iyzicoRes.checkoutFormContent) {
      req.log.warn({ iyzicoRes, buyerIp, amount: amountStr }, "iyzico_checkout_init_failed");
      // Pending transaction'ı başarısız olarak işaretle
      await db.update(walletTransactions)
        .set({ payment_status: "failed" })
        .where(eq(walletTransactions.id, txId));

      return reply.code(502).send({
        error: {
          message: "iyzico_init_failed",
          details: iyzicoRes.errorMessage ?? "Ödeme sistemi başlatılamadı",
          errorCode: iyzicoRes.errorCode,
        },
      });
    }

    return reply.send({
      provider: "iyzico",
      checkoutFormContent: iyzicoRes.checkoutFormContent,
      token: iyzicoRes.token,
      conversationId,
      amount,
      successUrl: `${frontendUrl}/panel/cuzdan/odeme-sonuc?status=success&amount=${encodeURIComponent(amountStr)}`,
      failUrl: `${frontendUrl}/panel/cuzdan/odeme-sonuc?status=fail`,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, "deposit_initiate_error");
  }
};

// ── İyzico: ödeme callback ────────────────────────────────────────────────────

/**
 * POST /wallet/deposit/callback — İyzico'dan gelen sonuç
 * Body: application/x-www-form-urlencoded — { token, status, conversationId? }
 * Bu endpoint PUBLIC'tir (İyzico sunucusundan gelir, cookie yok).
 * Başarıda frontend'e redirect atar.
 */
export const iyzicoCallback: RouteHandler = async (req, reply) => {
  const frontendBase = env.FRONTEND_URL;
  const successBase = `${frontendBase}/panel/cuzdan/odeme-sonuc`;

  try {
    const body = req.body as Record<string, string>;
    const token = body?.token;
    const iyzicoStatus = body?.status; // "success" veya "failure"

    if (!token) {
      return reply.redirect(`${successBase}?status=fail&reason=no_token`);
    }

    // Pending transaction'ı bul (transaction_ref = conversationId değil — token değil conversationId)
    // İyzico callback'te conversationId de gönderilir
    const conversationId = body?.conversationId;

    let pendingTx: (typeof walletTransactions.$inferSelect) | undefined;

    if (conversationId) {
      const rows = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.transaction_ref, conversationId))
        .limit(1);
      pendingTx = rows[0];
    }

    if (!pendingTx) {
      req.log.warn({ token, conversationId }, "iyzico_callback: transaction not found");
      return reply.redirect(`${successBase}?status=fail&reason=tx_not_found`);
    }

    // Zaten işlenmiş mi?
    if (pendingTx.payment_status !== "pending") {
      const alreadyOk = pendingTx.payment_status === "completed";
      return reply.redirect(
        `${successBase}?status=${alreadyOk ? "success" : "fail"}&reason=already_processed`,
      );
    }

    // Yüzeysel status kontrolü — güvenlik için İyzico'dan doğrulama iste
    if (iyzicoStatus !== "success") {
      await db.update(walletTransactions)
        .set({ payment_status: "failed" })
        .where(eq(walletTransactions.id, pendingTx.id));
      return reply.redirect(`${successBase}?status=fail&reason=payment_failed`);
    }

    // İyzico API'den doğrula
    const detail = await retrieveCheckoutForm(token, pendingTx.transaction_ref ?? conversationId ?? "");

    const paid = detail.status === "success" && detail.paymentStatus === "SUCCESS" && (detail.fraudStatus ?? 0) === 1;

    if (!paid) {
      await db.update(walletTransactions)
        .set({ payment_status: "failed" })
        .where(eq(walletTransactions.id, pendingTx.id));
      req.log.warn({ detail }, "iyzico_callback: payment verification failed");
      return reply.redirect(`${successBase}?status=fail&reason=verification_failed`);
    }

    // Bakiye ekle
    const amount = parseFloat(pendingTx.amount);
    await db.transaction(async (tx) => {
      await tx.update(wallets)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(wallets.id, pendingTx!.wallet_id));

      await tx.update(walletTransactions)
        .set({ payment_status: "completed" })
        .where(eq(walletTransactions.id, pendingTx!.id));
    });
    await invalidateWalletCachesForUsers([pendingTx.user_id]);

    req.log.info({ userId: pendingTx.user_id, amount }, "iyzico_callback: deposit completed");

    // Deposit başarı maili gönder
    const [depositUser] = await db.select().from(users).where(eq(users.id, pendingTx.user_id)).limit(1);
    const [updatedWallet] = await db.select().from(wallets).where(eq(wallets.id, pendingTx.wallet_id)).limit(1);
    if (depositUser) {
      void sendDepositSuccessMail({
        to: depositUser.email,
        user_name: depositUser.full_name ?? "Kullanıcı",
        amount: pendingTx.amount,
        new_balance: updatedWallet?.balance ?? "0",
      }).catch((err: unknown) => req.log.error(err, "deposit_success_mail_failed"));
    }

    return reply.redirect(
      `${successBase}?status=success&amount=${encodeURIComponent(pendingTx.amount)}`,
    );
  } catch (e) {
    req.log.error(e, "iyzico_callback: unexpected error");
    return reply.redirect(`${successBase}?status=fail&reason=server_error`);
  }
};

/** POST /wallet/deposit/paytr-callback — PayTR'den gelen sonuç (public) */
export const payTRDepositCallback: RouteHandler = async (req, reply) => {
  try {
    const body = req.body;
    if (!verifyPayTRCallback(body)) {
      req.log.warn({ body }, "paytr_deposit_callback: hash mismatch");
      return reply.send("PAYTR: hash mismatch");
    }

    if (!body || typeof body !== "object") return reply.send("ERROR");
    const rec = body as Record<string, unknown>;
    const merchant_oid = rec.merchant_oid;
    const status = rec.status;
    if (typeof merchant_oid !== "string" || typeof status !== "string") return reply.send("ERROR");
    const [pendingTx] = await db.select().from(walletTransactions)
      .where(eq(walletTransactions.transaction_ref, merchant_oid))
      .limit(1);

    if (!pendingTx || pendingTx.payment_status !== "pending") {
      return reply.send("OK");
    }

    if (status === "success") {
      const amount = parseFloat(pendingTx.amount);
      await db.transaction(async (tx) => {
        await tx.update(wallets)
          .set({ balance: sql`balance + ${amount}` })
          .where(eq(wallets.id, pendingTx.wallet_id));

        await tx.update(walletTransactions)
          .set({ payment_status: "completed" })
          .where(eq(walletTransactions.id, pendingTx.id));
      });
      await invalidateWalletCachesForUsers([pendingTx.user_id]);

      // Mail
      const [depositUser] = await db.select().from(users).where(eq(users.id, pendingTx.user_id)).limit(1);
      const [updatedWallet] = await db.select().from(wallets).where(eq(wallets.id, pendingTx.wallet_id)).limit(1);
      if (depositUser) {
        void sendDepositSuccessMail({
          to: depositUser.email,
          user_name: depositUser.full_name ?? "Kullanıcı",
          amount: pendingTx.amount,
          new_balance: updatedWallet?.balance ?? "0",
        }).catch((err: unknown) => req.log.error(err, "deposit_success_mail_failed"));
      }

      req.log.info({ userId: pendingTx.user_id, amount }, "paytr_deposit_callback: success");
    } else {
      await db.update(walletTransactions)
        .set({ payment_status: "failed" })
        .where(eq(walletTransactions.id, pendingTx.id));
    }

    return reply.send("OK");
  } catch (e) {
    req.log.error(e, "paytr_deposit_callback: error");
    return reply.send("ERROR");
  }
};

// ── Manuel deposit (admin/test) ───────────────────────────────────────────────

/** POST /wallet/deposit — bakiye yükle */
export const depositWallet: RouteHandler = async (req, reply) => {
  try {
    const userId = getAuthUserId(req);
    const { amount, description } = depositSchema.parse(req.body);

    const wallet = await getOrCreateWallet(userId);

    await db.transaction(async (tx) => {
      await tx.update(wallets)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(wallets.id, wallet.id));

      await tx.insert(walletTransactions).values({
        id: randomUUID(),
        wallet_id: wallet.id,
        user_id: userId,
        type: "credit",
        amount: amount.toFixed(2),
        purpose: "deposit",
        description: description ?? `₺${amount} bakiye yükleme`,
        payment_status: "completed",
      });
    });
    await invalidateWalletCachesForUsers([userId]);

    const [updated] = await db.select().from(wallets).where(eq(wallets.id, wallet.id)).limit(1);

    // Deposit başarı maili
    const [dUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (dUser) {
      void sendDepositSuccessMail({
        to: dUser.email,
        user_name: dUser.full_name ?? "Kullanıcı",
        amount: amount.toFixed(2),
        new_balance: updated?.balance ?? "0",
      }).catch((err: unknown) => req.log.error(err, "deposit_success_mail_failed"));
    }

    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, "wallet_deposit_error");
  }
};
