import {test,expect} from 'bun:test';
import {parseCanakkaleHtml,parseBursaHtml} from '../src/modules/etl/fetcher';
test('Canakkale fish category does not replace name or shift price columns',()=>{
 const rows=parseCanakkaleHtml('<table><tr><td>TOPTANCI HALİ 11.09.2026</td></tr><tr><td>BALIK</td><td>SARDALYA</td><td>KG</td><td>150,00TL</td><td>200,00TL</td></tr></table>');
 expect(rows[0]).toMatchObject({name:'SARDALYA',unit:'kg',min:150,max:200,avg:175,category:'balik',recordedDate:'2026-09-11'});
});
test('Bursa palamut pair is converted to a piece, never a kilogram',()=>{
 const rows=parseBursaHtml('<table><tr><td>Palamut</td><td>Çift</td><td>80 - 120 ₺</td></tr></table>');
 expect(rows[0]).toMatchObject({name:'Palamut (Adet)',unit:'adet',min:40,max:60,avg:50});
});
