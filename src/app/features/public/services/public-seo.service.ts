import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class PublicSeoService {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  updateTitle(title: string) {
    this.title.setTitle(`${title} | OpenPanel`);
  }

  updateMeta(name: string, content: string) {
    this.meta.updateTag({ name, content });
  }

  updateOpenGraph(property: string, content: string) {
    this.meta.updateTag({ property, content });
  }

  setEntradaSeo(entrada: any) {
    this.updateTitle(entrada.titulo);
    this.updateMeta('description', entrada.resumen || entrada.titulo);
    this.updateOpenGraph('og:title', entrada.titulo);
    this.updateOpenGraph('og:description', entrada.resumen || entrada.titulo);
  }
}
