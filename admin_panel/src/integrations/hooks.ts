"use client";

// =============================================================
// FILE: src/integrations/hooks.ts
// Explicit barrel exports for RTK Query hooks (vistaseeds)
// =============================================================

// =========================
// Public / Shared endpoints
// =========================

export {
  useGetSiteSettingByKeyQuery,
  useLazyGetSiteSettingByKeyQuery,
  useLazyListSiteSettingsQuery,
  useListSiteSettingsQuery,
} from "@/integrations/endpoints/public/site-settings-public-endpoints";
export {
  useAuthLogoutMutation,
  useAuthMeQuery,
  useAuthPasswordResetConfirmMutation,
  useAuthPasswordResetRequestMutation,
  useAuthRefreshMutation,
  useAuthSignupMutation,
  useAuthStatusQuery,
  useAuthTokenMutation,
  useAuthUpdateMutation,
  useLogoutMutation,
  useStatusQuery,
} from "@/integrations/endpoints/users/auth-public-endpoints";
export {
  useGetMyProfileQuery,
  useGetProfileByIdQuery,
  useUpsertMyProfileMutation,
} from "@/integrations/endpoints/users/profiles-endpoints";
export {
  useCreateUserRoleMutation,
  useDeleteUserRoleMutation,
  useListUserRolesQuery,
} from "@/integrations/endpoints/users/user-roles-endpoints";

// ==============
// Admin endpoints
// ==============

export {
  useAdminGetApiKeyDailyUsageQuery,
  useAdminListApiKeysQuery,
  useAdminRevokeApiKeyMutation,
  useAdminSetApiKeyTierMutation,
} from "@/integrations/endpoints/admin/api-keys-admin-endpoints";
export {
  useClearAuditLogsAdminMutation,
  useGetAuditGeoStatsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useListAuditRequestLogsAdminQuery,
} from "@/integrations/endpoints/admin/audit-admin-endpoints";
export {
  useGetAuditDataPullersAdminQuery,
  useGetAuditGeoCitiesAdminQuery,
  useGetAuditWidgetEmbeddersAdminQuery,
} from "@/integrations/endpoints/admin/audit-consumers-admin-endpoints";
export {
  useCreateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
  useGetCategoryAdminQuery,
  useLazyGetCategoryAdminQuery,
  useLazyListCategoriesAdminQuery,
  useListCategoriesAdminQuery,
  useReorderCategoriesAdminMutation,
  useSetCategoryImageAdminMutation,
  useToggleCategoryActiveAdminMutation,
  useToggleCategoryFeaturedAdminMutation,
  useToggleCategoryUnlimitedAdminMutation,
  useUpdateCategoryAdminMutation,
} from "@/integrations/endpoints/admin/categories-admin-endpoints";
export {
  useDeleteContactAdminMutation,
  useGetContactAdminQuery,
  useListContactsAdminQuery,
  useReplyContactAdminMutation,
  useUpdateContactAdminMutation,
} from "@/integrations/endpoints/admin/contacts-admin-endpoints";
export {
  useCreateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useGetCustomPageAdminQuery,
  useListCustomPagesAdminQuery,
  useReorderCustomPagesAdminMutation,
  useUpdateCustomPageAdminMutation,
} from "@/integrations/endpoints/admin/custom-pages-admin-endpoints";
export { useGetDashboardSummaryAdminQuery } from "@/integrations/endpoints/admin/dashboard-admin-endpoints";
export {
  useBootstrapUiSettingsAdminMutation,
  useCreateDbSnapshotAdminMutation,
  useDeleteDbSnapshotAdminMutation,
  useImportDbFileAdminMutation,
  useImportDbTextAdminMutation,
  useImportDbUrlAdminMutation,
  useImportModuleAdminMutation,
  useLazyExportDbAdminQuery,
  useLazyExportModuleAdminQuery,
  useLazyExportUiSettingsAdminQuery,
  useLazyValidateModulesAdminQuery,
  useListDbSnapshotsAdminQuery,
  useRestoreDbSnapshotAdminMutation,
} from "@/integrations/endpoints/admin/db-admin-endpoints";
export {
  useCreateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
  useGetEmailTemplateAdminQuery,
  useListEmailTemplatesAdminQuery,
  useUpdateEmailTemplateAdminMutation,
} from "@/integrations/endpoints/admin/email-templates-admin-endpoints";
export {
  useGa4ConfigQuery,
  useGa4CreateKeyEventMutation,
  useGa4DeleteKeyEventMutation,
  useGa4KeyEventsQuery,
  useGa4OverviewQuery,
  useGa4RealtimeQuery,
  useGa4ReportQuery,
  useGa4StatusQuery,
} from "@/integrations/endpoints/admin/ga4-admin-endpoints";
export {
  useGoogleAdsAccountsQuery,
  useGoogleAdsAddKeywordMutation,
  useGoogleAdsAddNegativeKeywordMutation,
  useGoogleAdsAddTextMutation,
  useGoogleAdsAddVideoMutation,
  useGoogleAdsAssetGroupAssetsQuery,
  useGoogleAdsAssetGroupsQuery,
  useGoogleAdsCampaignsQuery,
  useGoogleAdsConversionHealthQuery,
  useGoogleAdsInsightsQuery,
  useGoogleAdsKeywordStatusMutation,
  useGoogleAdsOfflineStatusQuery,
  useGoogleAdsOfflineUploadMutation,
  useGoogleAdsProductsQuery,
  useGoogleAdsRemoveAssetMutation,
  useGoogleAdsReportQuery,
  useGoogleAdsSetBiddingMutation,
  useGoogleAdsSetBudgetMutation,
  useGoogleAdsSetStatusMutation,
  useGoogleAdsStatusQuery,
  useGoogleAdsUploadAssetMutation,
  useGoogleAdsUploadAssetUrlMutation,
  useGoogleAdsVerifyMutation,
  useLazyGoogleAdsAdGroupsQuery,
  useLazyGoogleAdsCampaignsQuery,
} from "@/integrations/endpoints/admin/google-ads-admin-endpoints";
export {
  useGoogleConnectCredentialsMutation,
  useGoogleConnectDisconnectMutation,
  useGoogleConnectExchangeMutation,
  useGoogleConnectRedirectQuery,
  useGoogleConnectStatusQuery,
  useLazyGoogleConnectAuthUrlQuery,
} from "@/integrations/endpoints/admin/google-connect-admin-endpoints";
export {
  useGtmOverviewQuery,
  useGtmPublishMutation,
  useGtmStatusQuery,
} from "@/integrations/endpoints/admin/gtm-admin-endpoints";
export {
  useMetaSaveMutation,
  useMetaStatusQuery,
  useMetaTestMutation,
} from "@/integrations/endpoints/admin/meta-admin-endpoints";
export {
  useDeleteNewsletterAdminMutation,
  useListNewsletterAdminQuery,
  usePreviewWeeklyMailAdminQuery,
  useSendWeeklyMailAdminMutation,
  useSendWeeklyMailTestAdminMutation,
} from "@/integrations/endpoints/admin/newsletter-admin-endpoints";
export {
  useCreatePopupAdminMutation,
  useDeletePopupAdminMutation,
  useGetPopupAdminQuery,
  useListPopupsAdminQuery,
  useReorderPopupsAdminMutation,
  useSetPopupStatusAdminMutation,
  useUpdatePopupAdminMutation,
} from "@/integrations/endpoints/admin/popups-admin-endpoints";
export {
  useCreatePressCampaignAdminMutation,
  useCreatePressContactAdminMutation,
  useCreatePressLogAdminMutation,
  useGetPressSummaryAdminQuery,
  useImportPressContactsAdminMutation,
  useLazyExportPressContactsAdminQuery,
  useListPressCampaignsAdminQuery,
  useListPressContactsAdminQuery,
  useListPressLogsAdminQuery,
  useListPublicAnalysisReportsForPressQuery,
  useUpdatePressCampaignAdminMutation,
  useUpdatePressContactAdminMutation,
} from "@/integrations/endpoints/admin/press-admin-endpoints";
export {
  useDeleteRedirectAdminMutation,
  useGetSeoAuditAdminQuery,
  useListRedirectsAdminQuery,
  useRunSeoAuditActionAdminMutation,
  useUpdateRedirectAdminMutation,
  useUpsertRedirectsAdminMutation,
} from "@/integrations/endpoints/admin/redirects-admin-endpoints";
export {
  useGscAnalyticsQuery,
  useGscDeleteSitemapMutation,
  useGscIndexQuery,
  useGscIndexRefreshMutation,
  useGscInspectMutation,
  useGscOverviewQuery,
  useGscPageQueriesQuery,
  useGscSitemapsQuery,
  useGscSitesQuery,
  useGscStatusQuery,
  useGscSubmitSitemapMutation,
} from "@/integrations/endpoints/admin/search-console-admin-endpoints";
export {
  useBulkUpsertSiteSettingsAdminMutation,
  useCreateSiteSettingAdminMutation,
  useDeleteManySiteSettingsAdminMutation,
  useDeleteSiteSettingAdminMutation,
  useGetAppLocalesAdminQuery,
  useGetDefaultLocaleAdminQuery,
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from "@/integrations/endpoints/admin/site-settings-admin-endpoints";
export {
  useBulkCreateAssetsAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useCreateAssetAdminMutation,
  useDeleteAssetAdminMutation,
  useDiagCloudinaryAdminQuery,
  useGetAssetAdminQuery,
  useLazyDiagCloudinaryAdminQuery,
  useListAssetsAdminQuery,
  useListFoldersAdminQuery,
  usePatchAssetAdminMutation,
} from "@/integrations/endpoints/admin/storage-admin-endpoints";
export {
  useCreateSupportFaqAdminMutation,
  useDeleteSupportFaqAdminMutation,
  useDeleteSupportTicketAdminMutation,
  useGetSupportFaqAdminQuery,
  useGetSupportTicketAdminQuery,
  useListSupportFaqsAdminQuery,
  useListSupportTicketsAdminQuery,
  useReorderSupportFaqsAdminMutation,
  useUpdateSupportFaqAdminMutation,
  useUpdateSupportTicketAdminMutation,
} from "@/integrations/endpoints/admin/support-admin-endpoints";
export {
  useSendTelegramNotificationMutation,
  useTelegramEventMutation,
  useTelegramSendMutation,
  useTelegramSendTestMutation,
  useTelegramTestMutation,
} from "@/integrations/endpoints/admin/telegram-admin-endpoints";
export {
  useGetTelegramAutoReplyQuery,
  useListTelegramInboundQuery,
  useUpdateTelegramAutoReplyMutation,
} from "@/integrations/endpoints/admin/telegram-inbound-endpoints";
export { useTelegramWebhookSimulateMutation } from "@/integrations/endpoints/admin/telegram-webhook-endpoints";
export {
  useGetThemeAdminQuery,
  useResetThemeAdminMutation,
  useUpdateThemeAdminMutation,
} from "@/integrations/endpoints/admin/theme-admin-endpoints";
export {
  useLazyTwitterListTweetsQuery,
  useTwitterAiDraftMutation,
  useTwitterCancelTweetMutation,
  useTwitterListTweetsQuery,
  useTwitterPlansQuery,
  useTwitterSendMutation,
  useTwitterStatusQuery,
  useTwitterSyncHistoryMutation,
  useTwitterTemplatePreviewsQuery,
  useTwitterVerifyMutation,
} from "@/integrations/endpoints/admin/twitter-admin-endpoints";
export {
  useAdminGetQuery,
  useAdminListQuery,
  useAdminRemoveUserMutation,
  useAdminSetActiveMutation,
  useAdminSetPasswordMutation,
  useAdminSetRolesMutation,
  useAdminUpdateUserMutation,
  useGetUserAdminQuery,
  useListUsersAdminQuery,
  useRemoveUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserPasswordAdminMutation,
  useSetUserRolesAdminMutation,
  useUpdateUserAdminMutation,
} from "@/integrations/endpoints/admin/users/auth-admin-endpoints";
export {
  useDeleteAlertAdminMutation,
  useListAlertsAdminQuery,
  useUpdateAlertAdminMutation,
} from "@/integrations/endpoints/alerts-admin-endpoints";
export {
  useArchiveAnalysisReportAdminMutation,
  useCreateAnalysisReportAdminMutation,
  useDraftAnalysisReportAdminMutation,
  useGenerateAnalysisReportAdminMutation,
  useGetAnalysisReportAdminQuery,
  useListAnalysisReportsAdminQuery,
  usePublishAnalysisReportAdminMutation,
  useUpdateAnalysisReportAdminMutation,
} from "@/integrations/endpoints/analysis-reports-admin-endpoints";
export {
  useGetAnalyticsAdsAttributionAdminQuery,
  useGetAnalyticsAdsDailyAdminQuery,
  useGetAnalyticsDeviceDailyAdminQuery,
  useGetAnalyticsFunnelAdminQuery,
  useGetAnalyticsHeatmapAdminQuery,
  useGetAnalyticsOverviewAdminQuery,
  useGetAnalyticsRetentionAdminQuery,
} from "@/integrations/endpoints/analytics-admin-endpoints";
export {
  useCreateAuthorAdminMutation,
  useGetAuthorAdminQuery,
  useListAuthorsAdminQuery,
  useUpdateAuthorAdminMutation,
} from "@/integrations/endpoints/authors-admin-endpoints";
export {
  useGetCompetitorHistoryAdminQuery,
  useListCompetitorSitesAdminQuery,
  useRunCompetitorCheckAdminMutation,
  useToggleCompetitorSiteAdminMutation,
} from "@/integrations/endpoints/competitor-monitor-admin-endpoints";
export { useListEtlLogsAdminQuery } from "@/integrations/endpoints/etl-logs-admin-endpoints";
export {
  useCreateFirmDealAdminMutation,
  useCreateFirmSponsorshipAdminMutation,
  useDeleteFirmDealAdminMutation,
  useDeleteFirmSponsorshipAdminMutation,
  useListFirmClaimsAdminQuery,
  useListFirmDealsAdminQuery,
  useListFirmSponsorshipsAdminQuery,
  useListFirmsAdminQuery,
  useListStaleFirmsAdminQuery,
  useModerateFirmClaimAdminMutation,
  useRunFirmsEtlAdminMutation,
  useUpdateFirmAdminMutation,
  useUpdateFirmDealAdminMutation,
  useUpdateFirmSponsorshipAdminMutation,
} from "@/integrations/endpoints/firms-admin-endpoints";
export {
  useCreateHfProductAdminMutation,
  useDeleteHfProductAdminMutation,
  useGetHfProductAdminQuery,
  useListHfProductsAdminQuery,
  useMergeHfProductsAdminMutation,
  useUpdateHfProductAdminMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";
export {
  useCreateMarketAdminMutation,
  useDeleteMarketAdminMutation,
  useGetMarketAdminQuery,
  useListMarketsAdminQuery,
  useUpdateMarketAdminMutation,
} from "@/integrations/endpoints/markets-admin-endpoints";
export {
  useCreatePriceAdminMutation,
  useGetPriceAdminQuery,
  useListPricesAdminQuery,
  useUpdatePriceAdminMutation,
} from "@/integrations/endpoints/prices-admin-endpoints";
export {
  useCreateProductionAdminMutation,
  useDeleteProductionAdminMutation,
  useGetProductionAdminQuery,
  useListProductionAdminQuery,
  useUpdateProductionAdminMutation,
} from "@/integrations/endpoints/production-admin-endpoints";
