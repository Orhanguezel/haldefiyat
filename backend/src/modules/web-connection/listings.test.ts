import {expect,test} from 'bun:test';
import {listingItem,listingQuerySchema,readListingContent} from './listings';
test('negotiated prices and private fields cannot escape listing DTO',()=>{
 const r=listingItem({id:20,slug:'bean-20',price_type:'pazarlik',price_min:'50',quantity:'4',sponsored_now:0,contact_phone:'PRIVATE',raw:{secret:'PRIVATE'}},[{url:'/one.webp',display_order:0},{url:'javascript:alert(1)',display_order:1}]);
 expect(r.price).toBeNull();expect(r.price_min).toBeNull();expect(r.is_sponsored).toBe(false);expect(r.image_urls).toEqual(['https://haldefiyat.com/one.webp']);expect(JSON.stringify(r)).not.toContain('PRIVATE');
});
test('listing query is bounded and typed',()=>{expect(()=>listingQuerySchema.parse({limit:101})).toThrow();expect(()=>listingQuerySchema.parse({sponsored:'yes'})).toThrow();});
test('feed excludes unpublished expired suspicious and rehearsal listings; ordered gallery query',async()=>{
 const sqls:string[]=[];const mock={query:async(sql:string)=>{sqls.push(sql);return sql.includes('COUNT(*)')?[[{total:1}]]:sql.includes('FROM hf_listing_images')?[[{listing_id:20,url:'/a.webp',display_order:0}]]:[[{id:20,slug:'bean',price_type:'sabit',price_min:50}]];}};
 const r=await readListingContent(mock as any,{sponsored:'true',id:20});
 expect(sqls[0]).toContain("l.status='approved'");expect(sqls[0]).toContain('l.valid_until>=');expect(sqls[0]).toContain('l.is_suspicious=0');expect(sqls[0]).toContain('isTest');expect(sqls[0]).toContain('featured_until>UTC_TIMESTAMP()');expect(sqls[2]).toContain('ORDER BY listing_id,display_order,id');expect(r.items[0].price).toBe(50);
});
