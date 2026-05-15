import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SystemSettingsRuntimeService } from '@app/core/services/data/system-settings-runtime.service';
import { parseAllowedDate } from '@shared/utils/date-utils';

@Injectable({
  providedIn: 'root',
})
export class PublicSeoService {
  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
    private systemSettingsRuntime: SystemSettingsRuntimeService
  ) {}

  updateTitle(title: string) {
    const siteName = this.getSiteName();
    const normalizedTitle = String(title || '').trim();
    this.title.setTitle(normalizedTitle ? `${normalizedTitle} | ${siteName}` : siteName);
  }

  updateMeta(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }

  updateOpenGraph(property: string, content: string) {
    this.meta.updateTag({ property, content });
  }

  updateTwitter(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }

  setCanonicalUrl(url: string) {
    const href = String(url || '').trim();
    if (!href) return;
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  setJsonLd(id: string, data: unknown) {
    const scriptId = String(id || '').trim();
    if (!scriptId) return;
    const head = this.document.head;
    let el = head.querySelector<HTMLScriptElement>(`script#${CSS.escape(scriptId)}`);
    if (!el) {
      el = this.document.createElement('script');
      el.type = 'application/ld+json';
      el.id = scriptId;
      head.appendChild(el);
    }
    el.text = JSON.stringify(data);
  }

  setEntradaSeo(entrada: any) {
    const siteName = this.getSiteName();
    const siteDescription = this.getSiteDescription(siteName);
    const titulo = String(entrada?.titulo ?? siteName);
    const resumen = String(entrada?.resumen ?? siteDescription ?? titulo);
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const image = String(entrada?.imagenDestacadaUrl ?? `${origin}/assets/img/home-bg.jpg`);

    this.updateTitle(titulo);
    this.updateMeta('description', resumen);
    this.setCanonicalUrl(url);

    this.updateOpenGraph('og:title', titulo);
    this.updateOpenGraph('og:description', resumen);
    this.updateOpenGraph('og:site_name', siteName);
    this.updateOpenGraph('og:url', url);
    this.updateOpenGraph('og:type', 'article');
    this.updateOpenGraph('og:image', image);

    this.updateTwitter('twitter:card', 'summary_large_image');
    this.updateTwitter('twitter:title', titulo);
    this.updateTwitter('twitter:description', resumen);
    this.updateTwitter('twitter:image', image);

    const publishedDate = parseAllowedDate(entrada?.fechaPublicacion ?? null);
    const modifiedDate = parseAllowedDate(entrada?.fechaEdicion ?? null);
    const published = publishedDate ? publishedDate.toISOString() : null;
    const modified = modifiedDate ? modifiedDate.toISOString() : null;

    this.setJsonLd('op-public-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: titulo,
      description: resumen,
      image: [image],
      url,
      datePublished: published,
      dateModified: modified || published,
      author: entrada?.usernameCreador
        ? { '@type': 'Person', name: String(entrada.usernameCreador) }
        : undefined,
    });
  }

  private getSiteName(): string {
    return this.systemSettingsRuntime.getString('site.name', 'OpenPanel');
  }

  private getSiteDescription(siteName: string): string {
    return this.systemSettingsRuntime.getString('site.description', siteName);
  }
}
