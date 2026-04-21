'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Database, Download, Upload, RefreshCw,
  Trash2, RotateCcw, Shield, AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import {
  useCreateDbSnapshotAdminMutation,
  useListDbSnapshotsAdminQuery,
  useRestoreDbSnapshotAdminMutation,
  useDeleteDbSnapshotAdminMutation,
  useLazyExportDbAdminQuery,
  useImportDbTextAdminMutation,
  useImportDbUrlAdminMutation,
  useImportDbFileAdminMutation,
  useLazyExportModuleAdminQuery,
  useLazyValidateModulesAdminQuery,
  useBootstrapUiSettingsAdminMutation,
} from '@/integrations/hooks';
import {
  formatSnapshotSize,
  formatSnapshotDate,
  buildDbModuleOptions,
  type DbModuleValidationResult,
} from '@/integrations/shared';

// ---------------------------------------------------------------------------
// Snapshots Tab
// ---------------------------------------------------------------------------
function SnapshotsTab({ t }: { t: ReturnType<typeof useAdminT> }) {
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const { data: snapshots, isLoading } = useListDbSnapshotsAdminQuery();
  const [createSnapshot, { isLoading: creating }] = useCreateDbSnapshotAdminMutation();
  const [restoreSnapshot] = useRestoreDbSnapshotAdminMutation();
  const [deleteSnapshot] = useDeleteDbSnapshotAdminMutation();
  const [triggerExport, { isFetching: exporting }] = useLazyExportDbAdminQuery();

  const handleCreate = useCallback(async () => {
    if (!label.trim()) return;
    try {
      await createSnapshot({ label: label.trim(), note: note.trim() || undefined }).unwrap();
      toast.success(t('fullDb.snapshotCreated').replace('{label}', label.trim()));
      setLabel('');
      setNote('');
    } catch {
      toast.error(t('fullDb.snapshotError'));
    }
  }, [label, note, createSnapshot, t]);

  const handleRestore = useCallback(async (id: string, snapshotLabel: string) => {
    const msg = t('snapshots.restoreConfirm').replace('{label}', snapshotLabel);
    if (!window.confirm(msg)) return;
    try {
      await restoreSnapshot(id).unwrap();
      toast.success(t('snapshots.restoreSuccess'));
    } catch {
      toast.error(t('snapshots.restoreError'));
    }
  }, [restoreSnapshot, t]);

  const handleDelete = useCallback(async (id: string, snapshotLabel: string) => {
    const msg = t('snapshots.deleteConfirm').replace('{label}', snapshotLabel);
    if (!window.confirm(msg)) return;
    try {
      await deleteSnapshot(id).unwrap();
      toast.success(t('snapshots.deleteSuccess'));
    } catch {
      toast.error(t('snapshots.deleteFailed'));
    }
  }, [deleteSnapshot, t]);

  const handleExportSql = useCallback(async () => {
    try {
      const blob = await triggerExport().unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `db-export-${Date.now()}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('fullDb.exportSuccess'));
    } catch {
      toast.error(t('fullDb.exportError'));
    }
  }, [triggerExport, t]);

  return (
    <div className="space-y-6">
      {/* Create snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('fullDb.title')}
          </CardTitle>
          <CardDescription>{t('fullDb.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('fullDb.snapshotLabel')}</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('fullDb.snapshotPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('fullDb.noteLabel')}</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('fullDb.notePlaceholder')}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreate} disabled={creating || !label.trim()}>
              <Shield className="mr-2 h-4 w-4" />
              {creating ? t('fullDb.creating') : t('fullDb.createButton')}
            </Button>
            <Button variant="outline" onClick={handleExportSql} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? t('fullDb.sqlPreparing') : t('fullDb.sqlButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Snapshot list */}
      <Card>
        <CardHeader>
          <CardTitle>{t('snapshots.title')}</CardTitle>
          {snapshots && (
            <CardDescription>
              {t('snapshots.total')} {snapshots.length}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">{t('snapshots.loading')}</p>
          ) : !snapshots?.length ? (
            <p className="text-muted-foreground text-sm">{t('snapshots.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t('snapshots.columns.index')}</TableHead>
                    <TableHead>{t('snapshots.columns.labelNote')}</TableHead>
                    <TableHead>{t('snapshots.columns.file')}</TableHead>
                    <TableHead>{t('snapshots.columns.created')}</TableHead>
                    <TableHead>{t('snapshots.columns.size')}</TableHead>
                    <TableHead className="text-right">{t('snapshots.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{s.label || t('snapshots.noLabel')}</div>
                        <div className="text-muted-foreground text-xs">{s.note || t('snapshots.noNote')}</div>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs">{s.file}</TableCell>
                      <TableCell className="text-sm">{formatSnapshotDate(s.created_at)}</TableCell>
                      <TableCell className="text-sm">{formatSnapshotSize(s.size)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleRestore(s.id, s.label)}>
                            <RotateCcw className="mr-1 h-3 w-3" />
                            {t('snapshots.restore')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(s.id, s.label)}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            {t('snapshots.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import Tab
// ---------------------------------------------------------------------------
function ImportTab({ t }: { t: ReturnType<typeof useAdminT> }) {
  const [sqlText, setSqlText] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [truncate, setTruncate] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  const [importText, { isLoading: importingText }] = useImportDbTextAdminMutation();
  const [importUrlMut, { isLoading: importingUrl }] = useImportDbUrlAdminMutation();
  const [importFile, { isLoading: importingFile }] = useImportDbFileAdminMutation();

  const truncateLabel = truncate ? t('import.confirm.truncateYes') : t('import.confirm.truncateNo');

  const handleImportText = useCallback(async () => {
    if (!sqlText.trim()) { toast.error(t('import.text.required')); return; }
    const msg = t('import.confirm.text').replace('{truncate}', truncateLabel);
    if (!window.confirm(msg)) return;
    try {
      const res = await importText({ sql: sqlText, truncate_before: truncate, dry_run: dryRun }).unwrap();
      toast.success(dryRun ? t('import.success.dryRun') : t('import.success.text'));
      if (res.message) toast.info(res.message);
    } catch {
      toast.error(t('import.error.textGeneric'));
    }
  }, [sqlText, truncate, dryRun, importText, truncateLabel, t]);

  const handleImportUrl = useCallback(async () => {
    if (!importUrl.trim()) { toast.error(t('import.url.required')); return; }
    const msg = t('import.confirm.url').replace('{url}', importUrl).replace('{truncate}', truncateLabel);
    if (!window.confirm(msg)) return;
    try {
      await importUrlMut({ url: importUrl, truncate_before: truncate, dry_run: dryRun }).unwrap();
      toast.success(dryRun ? t('import.success.dryRun') : t('import.success.url'));
    } catch {
      toast.error(t('import.error.urlGeneric'));
    }
  }, [importUrl, truncate, dryRun, importUrlMut, truncateLabel, t]);

  const handleImportFile = useCallback(async () => {
    if (!selectedFile) { toast.error(t('import.file.required')); return; }
    const msg = t('import.confirm.file')
      .replace('{file}', selectedFile.name)
      .replace('{truncate}', truncateLabel);
    if (!window.confirm(msg)) return;
    const fd = new FormData();
    fd.append('file', selectedFile);
    if (truncate) fd.append('truncate_before', '1');
    try {
      await importFile(fd).unwrap();
      toast.success(t('import.success.file'));
    } catch {
      toast.error(t('import.error.fileGeneric'));
    }
  }, [selectedFile, truncate, importFile, truncateLabel, t]);

  const busy = importingText || importingUrl || importingFile;

  return (
    <div className="space-y-4">
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">{t('import.dangerLabel')}</span>{' '}
            {t('import.warning')}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">{t('import.tabs.text')}</TabsTrigger>
          <TabsTrigger value="url">{t('import.tabs.url')}</TabsTrigger>
          <TabsTrigger value="file">{t('import.tabs.file')}</TabsTrigger>
        </TabsList>

        {/* Text */}
        <TabsContent value="text" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('import.text.label')}</Label>
            <Textarea
              rows={8}
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              placeholder={t('import.text.placeholder')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={truncate} onCheckedChange={setTruncate} id="txt-trunc" />
              <Label htmlFor="txt-trunc">{t('import.truncate.label')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={dryRun} onCheckedChange={setDryRun} id="txt-dry" />
              <Label htmlFor="txt-dry">{t('import.dryRun.label')}</Label>
            </div>
          </div>
          <Button onClick={handleImportText} disabled={busy}>
            <Upload className="mr-2 h-4 w-4" />
            {importingText ? t('import.buttons.importing') : t('import.buttons.apply')}
          </Button>
        </TabsContent>

        {/* URL */}
        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('import.url.label')}</Label>
            <Input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder={t('import.url.placeholder')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={truncate} onCheckedChange={setTruncate} id="url-trunc" />
              <Label htmlFor="url-trunc">{t('import.truncate.label')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={dryRun} onCheckedChange={setDryRun} id="url-dry" />
              <Label htmlFor="url-dry">{t('import.dryRun.label')}</Label>
            </div>
          </div>
          <Button onClick={handleImportUrl} disabled={busy}>
            <Download className="mr-2 h-4 w-4" />
            {importingUrl ? t('import.buttons.importing') : t('import.buttons.importFromUrl')}
          </Button>
        </TabsContent>

        {/* File */}
        <TabsContent value="file" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('import.file.label')}</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".sql,.gz"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile && (
              <p className="text-muted-foreground text-xs">
                {t('import.file.selected')} {selectedFile.name}
              </p>
            )}
            <p className="text-muted-foreground text-xs">{t('import.file.note')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={truncate} onCheckedChange={setTruncate} id="file-trunc" />
            <Label htmlFor="file-trunc">{t('import.truncate.label')}</Label>
          </div>
          <Button onClick={handleImportFile} disabled={busy}>
            <Upload className="mr-2 h-4 w-4" />
            {importingFile ? t('import.buttons.importing') : t('import.buttons.importFromFile')}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modules Tab
// ---------------------------------------------------------------------------
function ModulesTab({ t }: { t: ReturnType<typeof useAdminT> }) {
  const [selectedModule, setSelectedModule] = useState('');
  const [validation, setValidation] = useState<DbModuleValidationResult | null>(null);
  const [sourceLocale, setSourceLocale] = useState('tr');
  const [targetLocale, setTargetLocale] = useState('en');
  const [overwrite, setOverwrite] = useState(false);

  const moduleOptions = buildDbModuleOptions();

  const [triggerExport, { isFetching: exportingModule }] = useLazyExportModuleAdminQuery();
  const [triggerValidate, { isFetching: validating }] = useLazyValidateModulesAdminQuery();
  const [bootstrap, { isLoading: bootstrapping }] = useBootstrapUiSettingsAdminMutation();

  const handleModuleExport = useCallback(async () => {
    if (!selectedModule) return;
    try {
      const blob = await triggerExport({ module: selectedModule, format: 'sql' }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedModule}-export-${Date.now()}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('modules.export.success').replace('{module}', selectedModule).replace('{format}', 'SQL'));
    } catch {
      toast.error(t('modules.export.error'));
    }
  }, [selectedModule, triggerExport, t]);

  const handleValidate = useCallback(async () => {
    try {
      const res = await triggerValidate().unwrap();
      setValidation(res);
    } catch {
      toast.error(t('modules.validate.statusError'));
    }
  }, [triggerValidate, t]);

  const handleBootstrap = useCallback(async () => {
    try {
      await bootstrap({
        source_locale: sourceLocale,
        target_locale: targetLocale,
        overwrite,
      }).unwrap();
      toast.success(t('modules.ui.bootstrapSuccess'));
    } catch {
      toast.error(t('modules.ui.bootstrapErrorGeneric'));
    }
  }, [sourceLocale, targetLocale, overwrite, bootstrap, t]);

  return (
    <div className="space-y-6">
      {/* Module select */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('modules.title')}</Label>
            <select
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full max-w-sm rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">--</option>
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {selectedModule && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                {t('modules.selected').replace('{module}', selectedModule)}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleModuleExport} disabled={exportingModule}>
                  <Download className="mr-2 h-4 w-4" />
                  {exportingModule ? t('modules.export.preparing') : t('modules.export.downloadButton')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validate */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules.validate.title')}</CardTitle>
          <CardDescription>{t('modules.validate.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleValidate} disabled={validating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${validating ? 'animate-spin' : ''}`} />
            {validating ? t('modules.validate.checking') : t('modules.validate.checkButton')}
          </Button>

          {!validation && !validating && (
            <p className="text-muted-foreground text-sm">{t('modules.validate.noResult')}</p>
          )}

          {validation?.modules?.map((m) => (
            <Card key={m.module} className="p-3">
              <p className="text-sm font-medium">
                {t('modules.validate.module')} {m.module} —{' '}
                <span className={m.status === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {m.status === 'ok' ? t('modules.validate.statusOk') : t('modules.validate.statusError')}
                </span>
              </p>
              {!!m.errors?.length && (
                <p className="text-destructive text-xs">
                  {t('modules.validate.errors')}: {m.errors.join(', ')}
                </p>
              )}
              {!!m.warnings?.length && (
                <p className="text-xs text-yellow-600">
                  {t('modules.validate.warnings')}: {m.warnings.join(', ')}
                </p>
              )}
              {!!m.declared_tables?.length && (
                <p className="text-muted-foreground text-xs">
                  {t('modules.validate.declaredTables')} {m.declared_tables.join(', ')}
                </p>
              )}
              {!!m.duplicates?.length && (
                <p className="text-destructive text-xs">
                  {t('modules.validate.duplicates')} {m.duplicates.join(', ')}
                </p>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* UI Bootstrap */}
      <Card>
        <CardHeader>
          <CardTitle>{t('modules.ui.title')}</CardTitle>
          <CardDescription>{t('modules.ui.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('modules.ui.sourceLocale')}</Label>
              <Input value={sourceLocale} onChange={(e) => setSourceLocale(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('modules.ui.targetLocale')}</Label>
              <Input value={targetLocale} onChange={(e) => setTargetLocale(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={overwrite} onCheckedChange={setOverwrite} id="ui-overwrite" />
              <Label htmlFor="ui-overwrite">{t('modules.ui.overwrite')}</Label>
            </div>
          </div>
          <Button onClick={handleBootstrap} disabled={bootstrapping}>
            <Upload className="mr-2 h-4 w-4" />
            {bootstrapping ? t('modules.ui.applying') : t('modules.ui.bootstrapButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function DbAdminClient() {
  const t = useAdminT('admin.db');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Tabs defaultValue="snapshots">
        <TabsList>
          <TabsTrigger value="snapshots">
            <Database className="mr-2 h-4 w-4" />
            {t('fullDb.title')}
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            {t('import.title')}
          </TabsTrigger>
          <TabsTrigger value="modules">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('modules.title')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshots">
          <SnapshotsTab t={t} />
        </TabsContent>
        <TabsContent value="import">
          <ImportTab t={t} />
        </TabsContent>
        <TabsContent value="modules">
          <ModulesTab t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
