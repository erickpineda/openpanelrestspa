import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

@Injectable({
  providedIn: 'root',
})
export class GtmService {
  private initialized = false;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  init(): void {
    if (this.initialized) return;
    const gtmId = String((environment as any)?.analytics?.gtmId ?? '').trim();
    if (!gtmId) return;

    const w = window as Window;
    w.dataLayer = Array.isArray(w.dataLayer) ? w.dataLayer : [];
    w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    this.document.head.appendChild(script);

    const noscript = this.document.createElement('noscript');
    const iframe = this.document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    this.document.body.prepend(noscript);

    this.initialized = true;
  }
}

