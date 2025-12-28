import { Component } from '@angular/core';

type HarSummary = {
  total: number;
  byStatus: { ok2xx: number; redir3xx: number; client4xx: number; server5xx: number; other: number };
  failed: {
    count: number;
    items: Array<{ method: string; status: number; url: string; mimeType?: string }>;
  };
  slow: {
    thresholdMs: number;
    count: number;
    items: Array<{ timeMs: number; url: string; status: number; mimeType?: string }>;
  };
  assetIssues: {
    scriptsFailed: number;
    stylesFailed: number;
    fontsFailed: number;
  };
};

@Component({
  selector: 'app-mantenimiento-dev-tools',
  templateUrl: './dev-tools.component.html',
  styleUrls: ['./dev-tools.component.scss'],
  standalone: false,
})
export class DevToolsComponent {
  features = [
    { name: 'Modo Depuración', enabled: true },
    { name: 'Simular Error', enabled: false },
    { name: 'Restablecer Caché', enabled: false },
  ];

  harText = '';
  harError = '';
  harSummary?: HarSummary;

  uiSnapshotsRaw = '';

  toggle(feature: any): void {
    feature.enabled = !feature.enabled;
  }

  analyzeHar(): void {
    this.harError = '';
    this.harSummary = undefined;

    const text = (this.harText || '').trim();
    if (!text) {
      this.harError = 'Pega el contenido JSON del HAR para analizarlo.';
      return;
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      this.harError = 'El HAR no es JSON válido.';
      return;
    }

    const entries = json?.log?.entries;
    if (!Array.isArray(entries)) {
      this.harError = 'No se encontró log.entries en el HAR.';
      return;
    }

    const slowThresholdMs = 2000;
    const failedItems: HarSummary['failed']['items'] = [];
    const slowItems: HarSummary['slow']['items'] = [];

    const byStatus = {
      ok2xx: 0,
      redir3xx: 0,
      client4xx: 0,
      server5xx: 0,
      other: 0,
    };

    let scriptsFailed = 0;
    let stylesFailed = 0;
    let fontsFailed = 0;

    for (const e of entries) {
      const method = String(e?.request?.method || 'GET');
      const url = String(e?.request?.url || '');
      const status = Number(e?.response?.status ?? 0);
      const mimeType = e?.response?.content?.mimeType ? String(e.response.content.mimeType) : undefined;
      const timeMs = Number(e?.time ?? 0);

      if (status >= 200 && status < 300) byStatus.ok2xx++;
      else if (status >= 300 && status < 400) byStatus.redir3xx++;
      else if (status >= 400 && status < 500) byStatus.client4xx++;
      else if (status >= 500 && status < 600) byStatus.server5xx++;
      else byStatus.other++;

      const failed = status === 0 || status >= 400;
      if (failed) {
        failedItems.push({ method, status, url, mimeType });
        if (this.isScript(url, mimeType)) scriptsFailed++;
        if (this.isStyle(url, mimeType)) stylesFailed++;
        if (this.isFont(url, mimeType)) fontsFailed++;
      }

      if (Number.isFinite(timeMs) && timeMs >= slowThresholdMs) {
        slowItems.push({ timeMs, url, status, mimeType });
      }
    }

    failedItems.sort((a, b) => b.status - a.status);
    slowItems.sort((a, b) => b.timeMs - a.timeMs);

    this.harSummary = {
      total: entries.length,
      byStatus,
      failed: {
        count: failedItems.length,
        items: failedItems.slice(0, 30),
      },
      slow: {
        thresholdMs: slowThresholdMs,
        count: slowItems.length,
        items: slowItems.slice(0, 30),
      },
      assetIssues: {
        scriptsFailed,
        stylesFailed,
        fontsFailed,
      },
    };
  }

  loadUiSnapshots(): void {
    this.uiSnapshotsRaw = '';
    try {
      const raw = localStorage.getItem('op_ui_anomaly_snapshots_v1');
      this.uiSnapshotsRaw = raw ? raw : '';
    } catch {
      this.uiSnapshotsRaw = '';
    }
  }

  clearUiSnapshots(): void {
    try {
      localStorage.removeItem('op_ui_anomaly_snapshots_v1');
    } catch {}
    this.uiSnapshotsRaw = '';
  }

  private isScript(url: string, mimeType?: string): boolean {
    const u = (url || '').toLowerCase();
    const m = (mimeType || '').toLowerCase();
    return u.includes('.js') || m.includes('javascript');
  }

  private isStyle(url: string, mimeType?: string): boolean {
    const u = (url || '').toLowerCase();
    const m = (mimeType || '').toLowerCase();
    return u.includes('.css') || m.includes('text/css');
  }

  private isFont(url: string, mimeType?: string): boolean {
    const u = (url || '').toLowerCase();
    const m = (mimeType || '').toLowerCase();
    return (
      u.includes('.woff') ||
      u.includes('.woff2') ||
      u.includes('.ttf') ||
      u.includes('.otf') ||
      m.includes('font/')
    );
  }

  trackByFeature(index: number, f: any): string {
    return f?.name ?? index.toString();
  }
}
