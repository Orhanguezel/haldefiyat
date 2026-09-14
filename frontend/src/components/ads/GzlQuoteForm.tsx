"use client";
import styles from "./GzlTechnologyBanner.module.css";
import { ContactForm } from "@/components/sections/ContactForm";

export default function GzlQuoteForm() {
  return <div className={styles.quote}><ContactForm embedded submitLabel="Teklif al" successTitle="Teklif talebiniz alındı" successMessage="İhtiyacınızı değerlendirmek ve kapsamı netleştirmek için paylaştığınız iletişim bilgileri üzerinden size ulaşacağız." subjectOptions={[
    { value: "GZL Teknoloji — Web sitesi / e-ticaret", label: "Web sitesi / e-ticaret" },
    { value: "GZL Teknoloji — Özel yazılım / ERP / CRM", label: "Özel yazılım / ERP / CRM" },
    { value: "GZL Teknoloji — Otomasyon / API entegrasyonu", label: "Otomasyon / API entegrasyonu" },
    { value: "GZL Teknoloji — Yapay zekâ / SEO", label: "Yapay zekâ / SEO" },
    { value: "GZL Teknoloji — Proje danışmanlığı", label: "Proje danışmanlığı / diğer" },
  ]} /></div>;
}
