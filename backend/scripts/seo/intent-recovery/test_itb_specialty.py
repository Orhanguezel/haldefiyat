import unittest,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('extract',Path(__file__).with_name('itb-specialty.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RegistrationTest(unittest.TestCase):
 def test_real_document_preserves_sale_and_excludes_fee(self):
  f=(m.ROOT/'backend/test/fixtures/seo-intent')/'20260901-tescil-bulteni-1.txt';rows,rejected=m.parse(f.read_text(),'2026-09-01','https://itb.org.tr/source.pdf')
  self.assertTrue(any(r['label']=='Çek.siz Kuru Üzüm 9 (Std) (Std)' and r['average']==72 and r['sale']=='HŞ' for r in rows))
  self.assertTrue(any(r['reason']=='no positive comparable price' for r in rejected))
 def test_date_mismatch_rejected(self):
  with self.assertRaises(ValueError):m.parse('TARİH : 01.09.2026','2026-09-02','https://itb.org.tr/source.pdf')
 def test_same_class_distinct_sale_rows_kept(self):
  f=(m.ROOT/'backend/test/fixtures/seo-intent')/'20260903-tescil-bulteni-1.txt';rows,_=m.parse(f.read_text(),'2026-09-03','https://itb.org.tr/source.pdf');self.assertEqual({r['sale'] for r in rows},{'HŞ','MS'});self.assertEqual(len(rows),2)
if __name__=='__main__':unittest.main()
