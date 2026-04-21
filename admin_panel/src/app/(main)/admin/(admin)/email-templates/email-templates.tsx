"use client";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import EmailTemplatesListPanel from "./_components/email-templates-list-panel";

export default function EmailTemplatesPage() {
  const t = useAdminT("admin.emailTemplates");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("list.title")}</CardTitle>
          <CardDescription>{t("list.description")}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">{t("list.title")}</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <EmailTemplatesListPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
