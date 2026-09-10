import { ownerVisibilityReason } from "./evidence-policy";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId, handleRouteError, sendNotFound } from "@agro/shared-backend/modules/_shared";
import { orders } from "@agro/shared-backend/modules/orders/schema";
import { db } from "@/db/client";
import { hfListings, hfListingImages } from "./schema";
import { parseCallAvailability } from "./public";

const notDeleted = sql`JSON_EXTRACT(${hfListings.raw}, '$.ownerDeletedAt') IS NULL`;
export const renewalSchema = z.object({ validUntil:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value && value > new Date().toISOString().slice(0,10);
}, "Yeni son tarih gelecekte olmalıdır.") });
const orderKind = sql`JSON_UNQUOTE(JSON_EXTRACT(IF(JSON_VALID(${orders.notes}), ${orders.notes}, '{}'), '$.kind')) = 'listing_feature_transfer'`;
const orderListing = (id:number) => sql`JSON_EXTRACT(IF(JSON_VALID(${orders.notes}), ${orders.notes}, '{}'), '$.listingId') = ${id}`;
function conflict(message:string):never {throw Object.assign(new Error(message),{statusCode:409});}
const handler = (fn:(req:FastifyRequest)=>Promise<unknown>) => async(req:FastifyRequest,reply:FastifyReply) => {
  reply.header('Cache-Control','no-store');
  try {const result=await fn(req);return result ?? sendNotFound(reply);} catch(error:any){
    if(error.statusCode===409)return reply.code(409).send({error:{message:error.message}});
    return handleRouteError(reply,req,error,'owner_listing_lifecycle');
  }
};
const listingId=(req:FastifyRequest)=>z.coerce.number().int().positive().parse((req.params as {id:string}).id);

export function registerOwnerListingLifecycle(app:FastifyInstance) {
  app.get('/listings/me/:id',{onRequest:[requireAuth]},handler(async req=>{
    const id=listingId(req);
    const [item]=await db.select().from(hfListings).where(and(eq(hfListings.id,id),eq(hfListings.userId,getAuthUserId(req)),notDeleted));
    if(!item)return null;
    const images=await db.select({url:hfListingImages.url}).from(hfListingImages).where(eq(hfListingImages.listingId,id)).orderBy(hfListingImages.displayOrder);
    return {item:{...item,visibilityReason:ownerVisibilityReason(item),images:images.map(image=>image.url),callAvailability:parseCallAvailability(item.callAvailability)}};
  }));
  app.post('/listings/:id/renew',{onRequest:[requireAuth]},handler(async req=>{
    const id=listingId(req); const {validUntil}=renewalSchema.parse(req.body);
    return db.transaction(async tx=>{
      const [item]=await tx.select().from(hfListings).where(and(eq(hfListings.id,id),eq(hfListings.userId,getAuthUserId(req)),notDeleted)).for('update');
      if(!item)return null;
      if(validUntil<=item.validUntil)conflict('Yeni tarih mevcut son tarihten sonra olmalıdır.');
      await tx.update(hfListings).set({validUntil,status:'pending'}).where(eq(hfListings.id,id));
      return {ok:true,status:'pending',validUntil};
    });
  }));
  app.delete('/listings/:id',{onRequest:[requireAuth]},handler(async req=>{
    const id=listingId(req);const userId=getAuthUserId(req);
    return db.transaction(async tx=>{
      const [item]=await tx.select().from(hfListings).where(and(eq(hfListings.id,id),eq(hfListings.userId,userId),notDeleted)).for('update');
      if(!item)return null;
      const pending=await tx.select().from(orders).where(and(eq(orders.dealer_id,userId),orderKind,orderListing(id),eq(orders.status,'pending'))).for('update');
      if(pending.some(order=>order.payment_status==='pending'))conflict('Kontrol bekleyen havale bildiriminiz var. Silmeden önce yöneticiyle ödeme talebini sonuçlandırın.');
      await tx.update(orders).set({status:'cancelled',payment_status:'failed'}).where(and(eq(orders.dealer_id,userId),orderKind,orderListing(id),eq(orders.status,'pending'),eq(orders.payment_status,'unpaid')));
      // Keep offer/payment audit records; remove the listing from owner/public
      // views and stop its promotion atomically.
      await tx.update(hfListings).set({status:'closed',isFeatured:0,featuredUntil:null,raw:{...(item.raw ?? {}),ownerDeletedAt:new Date().toISOString()}}).where(eq(hfListings.id,id));
      return {ok:true};
    });
  }));
}
