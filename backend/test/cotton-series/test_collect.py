import importlib.util, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('cotton_collect',ROOT/'scripts/cotton-series/collect.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CottonSeriesTest(unittest.TestCase):
 def test_turkish_decimals(self):
  self.assertEqual(m.number('2.669.888,50'),'2669888.50');self.assertEqual(m.number('4,40'),'4.40');self.assertIsNone(m.number('---'))
  with self.assertRaises(ValueError):m.number('12 TL')
 def test_month_end_and_partial(self):
  self.assertEqual(list(m.month_ranges('2024-02',m.date(2024,3,7))),[('2024-02-01','2024-02-29'),('2024-03-01','2024-03-07')])
 def test_sutb_real_source_retains_price_definition(self):
  p=Path(__file__).parent/'fixtures/sutb-2025-09.html'
  rows,q=m.parse_sutb(p.read_text(),'2025-09-01','2025-09-30','https://example.com','x')
  r=next(x for x in rows if x['cotton_form']=='seed_cotton')
  self.assertEqual(r['avg_price'],'25.50');self.assertEqual(r['min_price'],'25.00');self.assertEqual(r['transaction_count'],4)
  self.assertNotEqual(r['derived_weighted_price'],r['avg_price']);self.assertEqual(m.validate(r),[])
  self.assertFalse(any('YAĞ' in x['product'] for x in rows))
  with self.assertRaises(ValueError):m.parse_sutb(p.read_text(),'2024-09-01','2024-09-30','https://example.com','x')
 def test_itb_2013_below_twenty_and_no_fx_leak(self):
  p=Path(__file__).parent/'fixtures/itb-2013-01.txt'
  rows,q=m.parse_itb(p.read_text(),'2013-01-01','2013-01-31','https://example.com','x')
  self.assertEqual(q,[]);self.assertEqual(len(rows),2);self.assertEqual(rows[0]['avg_price'],'3.38')
  self.assertEqual(rows[0]['average_method'],'ready_cash_and_nominal_average')
 def test_actual_dot_decimal_bulletin(self):
  p=Path(__file__).parent/'fixtures/itb-201302.txt'
  rows,q=m.parse_itb(p.read_text(),'2013-02-01','2013-02-28','https://example.com','x')
  self.assertEqual(q,[]);self.assertEqual(rows[0]['avg_price'],'3.67')
 def test_actual_wrong_month_bulletin(self):
  p=Path(__file__).parent/'fixtures/itb-202202.txt'
  with self.assertRaises(m.SourceDocumentError):m.parse_itb(p.read_text(),'2022-02-01','2022-02-28','https://example.com','x')
 def test_distinct_payment_and_method_series(self):
  values=dict(min_price='1',max_price='2',avg_price='1.5',quantity_kg=None,turnover_try=None,transaction_count=None,derived_weighted_price=None)
  def row(payment,method):return m.make_row('sutb','2025-01-01','2025-01-31','PAMUK','lint','HTS',payment,'registered_transaction',values,'https://example.com','x','raw',method)
  self.assertNotEqual(row('PEŞİN','a')['series_id'],row('VADELİ','a')['series_id']);self.assertNotEqual(row('PEŞİN','a')['series_id'],row('PEŞİN','b')['series_id'])
 def test_invalid_source_quarantined(self):
  r=dict(min_price='10',max_price='12',avg_price='20',transaction_count=1,quantity_kg='1',derived_weighted_price='11')
  self.assertIn('price_order_or_nonpositive',m.validate(r))
if __name__=='__main__':unittest.main()
