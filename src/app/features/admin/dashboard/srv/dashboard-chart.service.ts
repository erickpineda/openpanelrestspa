import { Injectable } from '@angular/core';
import { ContentStatsDTO, ActivityPointDTO } from '@shared/models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardChartService {
  private colorPalette: string[] = [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ab',
    '#1f77b4',
    '#d62728',
  ];

  constructor() {}

  formatLabelFromDate(
    dateStr: string | undefined,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    short = true
  ): string {
    if (!dateStr) return '';
    try {
      // Append time part if missing to parse correctly as UTC or Local?
      // Original code used dateStr + 'T00:00:00Z' which assumes YYYY-MM-DD
      const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00Z');
      if (isNaN(d.getTime())) return String(dateStr);

      const opts: Intl.DateTimeFormatOptions =
        granularity === 'month'
          ? { month: 'short' }
          : granularity === 'week'
            ? { day: '2-digit', month: 'short' }
            : { day: '2-digit', month: 'short' };
      return new Intl.DateTimeFormat('es-ES', opts).format(d);
    } catch {
      return String(dateStr);
    }
  }

  colorForLabel(label: string, index: number): string {
    if (!label) return '#ccc';
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = Math.abs(hash) % this.colorPalette.length;
    return this.colorPalette[c] || this.colorPalette[index % this.colorPalette.length];
  }

  transformSplitEstado(arr: any[]): any {
    const labels = Array.isArray(arr) ? arr.map((p) => this.formatLabelFromDate(p?.date)) : [];
    const hasNested =
      Array.isArray(arr) && arr.some((p) => p && typeof p.entradasByEstado === 'object');

    let datasets: any[] = [];

    if (hasNested) {
      const estados = Array.from(
        new Set(arr.flatMap((p) => Object.keys(p.entradasByEstado || {})))
      );
      datasets = estados.map((estado, i) => ({
        label: estado,
        backgroundColor: this.colorForLabel(estado, i),
        data: arr.map((p) => Number(p.entradasByEstado?.[estado]) || 0),
      }));
    } else {
      const keys = Array.from(
        new Set(arr.flatMap((p) => Object.keys(p || {}).filter((k) => k !== 'date')))
      );
      datasets = keys.map((k, i) => ({
        label: String(k).toUpperCase(),
        backgroundColor: this.colorForLabel(k, i),
        data: arr.map((p) => Number(p?.[k] || 0)),
      }));
    }
    return { labels, datasets };
  }

  transformSplitEstadoNombre(arr: any[]): any {
    const flatArr = Array.isArray(arr)
      ? arr.map((p) =>
          p && typeof p.entradasByEstado === 'object' ? { date: p.date, ...p.entradasByEstado } : p
        )
      : [];
    const labels = flatArr.map((p) => this.formatLabelFromDate(p?.date));
    const estadosSet = new Set<string>();
    flatArr.forEach((p) => Object.keys(p || {}).forEach((k) => k !== 'date' && estadosSet.add(k)));
    const estados = Array.from(estadosSet);
    const datasets = estados.map((e, i) => ({
      label: String(e),
      backgroundColor: this.colorForLabel(e, i),
      borderColor: this.colorForLabel(e, i),
      fill: false,
      tension: 0.2,
      data: flatArr.map((r) => Number(r?.[e] || 0)),
    }));
    return { labels, datasets };
  }

  generateContentStatsChart(cs: ContentStatsDTO): any {
    if (!cs || !cs.entradasByEstado) return null;
    const entries = Object.entries(cs.entradasByEstado);
    const labels = entries.map(([k]) => k);
    const data = entries.map(([, v]) => Number(v) || 0);
    const backgroundColor = labels.map((l, i) => this.colorForLabel(l, i));
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
        },
      ],
    };
  }

  getEtatNominalOptions(stacked: boolean): any {
    return {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        x: { stacked },
        y: { stacked },
      },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { mode: 'index', intersect: false },
      },
    };
  }

  calculateKpiPublicadas(cs: ContentStatsDTO | undefined): number {
    if (cs && cs.entradasByEstado) {
      const keys = Object.keys(cs.entradasByEstado);
      const key = keys.find((k) => k.trim().toUpperCase() === 'PUBLICADA');
      return key ? Number(cs.entradasByEstado[key]) || 0 : 0;
    }
    return 0;
  }

  calculateKpiNoPublicadas(cs: ContentStatsDTO | undefined): number {
    if (cs && cs.entradasByEstado) {
      return Object.entries(cs.entradasByEstado)
        .filter(([k]) => k.trim().toUpperCase() !== 'PUBLICADA')
        .reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    }
    return 0;
  }

  calculateSumSeries(data: any, datasetIndex: number): number {
    try {
      const arr =
        data &&
        data.datasets &&
        data.datasets[datasetIndex] &&
        Array.isArray(data.datasets[datasetIndex].data)
          ? (data.datasets[datasetIndex].data as number[])
          : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    } catch {
      return 0;
    }
  }

  calculateContentEstadoRows(
    cs: ContentStatsDTO | undefined
  ): { estado: string; total: number; porcentaje: number }[] {
    const entries =
      cs && (cs as any).entradasByEstado ? Object.entries((cs as any).entradasByEstado) : [];
    const total =
      (cs as any)?.totalEntradas || entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    return entries
      .map(([k, v]) => {
        const count = Number(v) || 0;
        const pct = total > 0 ? Math.round((count * 1000) / total) / 10 : 0;
        return { estado: k, total: count, porcentaje: pct };
      })
      .sort((a, b) => b.total - a.total);
  }

  generateMainSeriesChart(points: ActivityPointDTO[]): any {
    return {
      labels: points.map((p) => this.formatLabelFromDate(p.date)),
      datasets: [
        {
          label: 'Entradas',
          backgroundColor: '#007bff',
          data: points.map((p) => p.entradas),
        },
        {
          label: 'Comentarios',
          backgroundColor: '#ff7f0e',
          data: points.map((p) => p.comentarios),
        },
        {
          label: 'Usuarios',
          backgroundColor: '#2ca02c',
          data: points.map((p) => p.usuarios),
        },
      ],
    };
  }

  formatBytes(bytes?: number): string {
    const b = Number(bytes) || 0;
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  getPeriodDates(days: number): { startDate: string; endDate: string } {
    const now = new Date();
    // Use tomorrow as end date to include today in <= queries
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - Math.max(1, Math.min(365, Number(days) || 30)));
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }

  generateEmptyMainSeriesChart(days: number): any {
    const labels: string[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const s = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      labels.push(this.formatLabelFromDate(s, 'day', false));
    }
    const zeros = Array(labels.length).fill(0);
    return {
      labels,
      datasets: [
        { label: 'Entradas', backgroundColor: '#007bff', data: [...zeros] },
        { label: 'Comentarios', backgroundColor: '#ff7f0e', data: [...zeros] },
        { label: 'Usuarios', backgroundColor: '#2ca02c', data: [...zeros] },
      ],
    };
  }
}
