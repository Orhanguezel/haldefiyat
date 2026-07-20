import type { FastifyInstance } from "fastify";
import { registerListingsPublic, registerListingsAdmin } from "./router";

export async function registerListings(app: FastifyInstance) {
  await registerListingsPublic(app);
}

export { registerListingsAdmin, registerListingsPublic };
export { expireListings } from "./repo";
export { sendListingExpiryReminders } from "./expiry-reminder";
