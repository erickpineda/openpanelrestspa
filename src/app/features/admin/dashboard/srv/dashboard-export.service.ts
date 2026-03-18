import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ContentStatsDTO, StorageDTO, TopItemDTO } from '@shared/models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardExportService {
  constructor() {}

  downloadCurrentData(payload: any): void {
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      saveAs(blob, `dashboard_export_${new Date().toISOString()}.json`);
    } catch (error) {
      console.error('Error exporting data', error);
      throw error;
    }
  }

  downloadCsv(data: any): void {
    try {
      const now = new Date();
      const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      if (data && Array.isArray(data.labels) && Array.isArray(data.datasets)) {
        const headers = ['date', ...data.datasets.map((ds: any) => String(ds.label || 'serie'))];
        const rows: any[][] = (data.labels as string[]).map((d: string, i: number) => [
          d,
          ...data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `dashboard_series_${datePart}_${timePart}.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadSeriesSplitEstadoCsv(data: any): void {
    try {
      if (data && Array.isArray(data.labels) && Array.isArray(data.datasets)) {
        const headers = ['date', ...data.datasets.map((ds: any) => String(ds.label || 'valor'))];
        const rows: any[][] = (data.labels as string[]).map((d: string, i: number) => [
          d,
          ...data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `series_split_estado.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadSeriesSplitEstadoNombreCsv(data: any): void {
    try {
      if (data && Array.isArray(data.labels) && Array.isArray(data.datasets)) {
        const headers = ['date', ...data.datasets.map((ds: any) => String(ds.label || 'estado'))];
        const rows: any[][] = (data.labels as string[]).map((d: string, i: number) => [
          d,
          ...data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
        ]);
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `series_split_estado_nombre.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadRecentActivityCsv(items: any[]): void {
    try {
      if (Array.isArray(items) && items.length) {
        // Asumimos estructura genérica para recent items
        const headers = Object.keys(items[0]);
        const rows = items.map((item) => headers.map((h) => item[h]));
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `recent_activity.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadStorageCsv(storage: StorageDTO): void {
    try {
      if (storage) {
        const csv = this.buildCsv(
          ['metric', 'value'],
          [
            ['totalFiles', storage.totalFiles ?? 0],
            ['storageBytes', storage.storageBytes ?? 0],
          ]
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `storage.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadContentStatsCsv(contentStats: ContentStatsDTO): void {
    try {
      if (contentStats) {
        const csv = this.buildCsv(
          ['metric', 'value'],
          [
            ['totalUsuarios', contentStats.totalUsuarios ?? 0],
            ['totalEntradas', contentStats.totalEntradas ?? 0],
            ['totalComentarios', contentStats.totalComentarios ?? 0],
            ['totalFicheros', contentStats.totalFicheros ?? 0],
            ['storageBytes', contentStats.storageBytes ?? 0],
          ]
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `content_stats.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadContentStatsEstadosCsv(contentStats: ContentStatsDTO): void {
    try {
      if (contentStats && contentStats.entradasByEstado) {
        const headers = ['estado', 'count'];
        const rows = Object.entries(contentStats.entradasByEstado).map(([k, v]) => [
          k,
          Number(v) || 0,
        ]);
        const csv = this.buildCsv(headers, rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `content_stats_estados.csv`);
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadTopUsersCsv(items: TopItemDTO[]): void {
    try {
      if (Array.isArray(items) && items.length) {
        const csv = this.buildCsv(
          ['name', 'count'],
          items.map((t) => [t?.name ?? '', t?.count ?? 0])
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'top_users.csv');
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadTopCategoriesCsv(items: TopItemDTO[]): void {
    try {
      if (Array.isArray(items) && items.length) {
        const csv = this.buildCsv(
          ['name', 'count'],
          items.map((t) => [t?.name ?? '', t?.count ?? 0])
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'top_categories.csv');
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  downloadTopTagsCsv(items: TopItemDTO[]): void {
    try {
      if (Array.isArray(items) && items.length) {
        const csv = this.buildCsv(
          ['name', 'count'],
          items.map((t) => [t?.name ?? '', t?.count ?? 0])
        );
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'top_tags.csv');
      }
    } catch (error) {
      console.error('Error downloading CSV', error);
      throw error;
    }
  }

  async downloadZip(
    data: any,
    seriesEntriesSplitData: any,
    seriesEntriesSplitEstadoNombreData: any,
    topUsers: TopItemDTO[],
    topCategories: TopItemDTO[],
    topTags: TopItemDTO[],
    contentStats?: ContentStatsDTO,
    storage?: StorageDTO
  ): Promise<void> {
    const zip = new JSZip();
    const now = new Date();
    const datePart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timePart = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const folder = zip.folder(`dashboard_${datePart}_${timePart}`) as JSZip;

    const addFile = (name: string, content: string) => {
      if (folder) folder.file(name, content);
    };

    if (data && Array.isArray(data.labels) && Array.isArray(data.datasets)) {
      const headers = ['date', ...data.datasets.map((ds: any) => String(ds.label || 'serie'))];
      const rows: any[][] = (data.labels as string[]).map((d: string, i: number) => [
        d,
        ...data.datasets.map((ds: any) => (Array.isArray(ds.data) ? (ds.data[i] ?? '') : '')),
      ]);
      addFile('series.csv', this.buildCsv(headers, rows));
    }

    if (
      seriesEntriesSplitData &&
      Array.isArray(seriesEntriesSplitData.labels) &&
      Array.isArray(seriesEntriesSplitData.datasets)
    ) {
      const headers = [
        'date',
        ...seriesEntriesSplitData.datasets.map((ds: any) => String(ds.label || 'valor')),
      ];
      const rows: any[][] = (seriesEntriesSplitData.labels as string[]).map(
        (d: string, i: number) => [
          d,
          ...seriesEntriesSplitData.datasets.map((ds: any) =>
            Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
          ),
        ]
      );
      addFile('series_split_estado.csv', this.buildCsv(headers, rows));
    }

    if (
      seriesEntriesSplitEstadoNombreData &&
      Array.isArray(seriesEntriesSplitEstadoNombreData.labels) &&
      Array.isArray(seriesEntriesSplitEstadoNombreData.datasets)
    ) {
      const headers = [
        'date',
        ...seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
          String(ds.label || 'estado')
        ),
      ];
      const rows: any[][] = (seriesEntriesSplitEstadoNombreData.labels as string[]).map(
        (d: string, i: number) => [
          d,
          ...seriesEntriesSplitEstadoNombreData.datasets.map((ds: any) =>
            Array.isArray(ds.data) ? (ds.data[i] ?? '') : ''
          ),
        ]
      );
      addFile('series_split_estado_nombre.csv', this.buildCsv(headers, rows));
    }

    if (Array.isArray(topUsers) && topUsers.length) {
      addFile(
        'top_users.csv',
        this.buildCsv(
          ['name', 'count'],
          topUsers.map((t) => [t?.name ?? '', t?.count ?? 0])
        )
      );
    }

    if (Array.isArray(topCategories) && topCategories.length) {
      addFile(
        'top_categories.csv',
        this.buildCsv(
          ['name', 'count'],
          topCategories.map((t) => [t?.name ?? '', t?.count ?? 0])
        )
      );
    }

    if (Array.isArray(topTags) && topTags.length) {
      addFile(
        'top_tags.csv',
        this.buildCsv(
          ['name', 'count'],
          topTags.map((t) => [t?.name ?? '', t?.count ?? 0])
        )
      );
    }

    if (contentStats) {
      addFile(
        'content_stats.csv',
        this.buildCsv(
          ['metric', 'value'],
          [
            ['totalUsuarios', contentStats.totalUsuarios ?? 0],
            ['totalEntradas', contentStats.totalEntradas ?? 0],
            ['totalComentarios', contentStats.totalComentarios ?? 0],
            ['totalFicheros', contentStats.totalFicheros ?? 0],
            ['storageBytes', contentStats.storageBytes ?? 0],
          ]
        )
      );
      if (contentStats.entradasByEstado) {
        const headers = ['estado', 'count'];
        const rows = Object.entries(contentStats.entradasByEstado).map(([k, v]) => [
          k,
          Number(v) || 0,
        ]);
        addFile('content_stats_estados.csv', this.buildCsv(headers, rows));
      }
    }

    if (storage) {
      addFile(
        'storage.csv',
        this.buildCsv(
          ['metric', 'value'],
          [
            ['totalFiles', storage.totalFiles ?? 0],
            ['storageBytes', storage.storageBytes ?? 0],
          ]
        )
      );
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `dashboard_${datePart}_${timePart}.zip`);
  }

  private csvEscape(v: any): string {
    const s = String(v ?? '');
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  private buildCsv(headers: string[], rows: any[][]): string {
    const head = headers.map((h) => this.csvEscape(h)).join(',');
    const body = rows.map((r) => r.map((c) => this.csvEscape(c)).join(',')).join('\n');
    return `${head}\n${body}\n`;
  }
}
