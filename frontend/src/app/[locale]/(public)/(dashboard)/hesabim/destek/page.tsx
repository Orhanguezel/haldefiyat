export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { TicketList } from "@/components/dashboard/support/TicketList";
import { NewTicketForm } from "@/components/dashboard/support/NewTicketForm";

type Props = { params: Promise<{ locale: string }> };

export default async function DestekPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-8">
      <h1 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
        Destek
      </h1>
      <NewTicketForm />
      <TicketList locale={locale} />
    </div>
  );
}
