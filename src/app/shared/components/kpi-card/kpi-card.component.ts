import { Component, Input, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, Renderer2, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KpiCardComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() iconName?: string;
  @Input() color?: string;
  @Input() variant: 'flat' | 'simple' = 'flat';
  @Input() route?: string | any[];
  @Input() tooltip?: string;
  
  @ViewChild('kpiBody', { static: false }) kpiBody?: ElementRef<HTMLElement>;

  displayValue: string | number = '';
  private animationFrameId?: number;
  private observer?: MutationObserver;

  get resolvedIcon(): string {
    if (this.iconName) return this.iconName;
    const key = (this.label || '').toLowerCase();
    if (key.includes('usuario')) return 'cilUser';
    if (key.includes('entrada')) return 'cilNotes';
    if (key.includes('no publicada') || key.includes('no publicadas')) return 'cilXCircle';
    if (key.includes('publicada')) return 'cilCheckCircle';
    return 'cilSpeedometer';
  }

  get resolvedColor(): string | undefined {
    if (this.color) return this.color;
    const key = (this.label || '').toLowerCase();
    if (key.includes('usuario')) return 'primary';
    if (key.includes('entrada')) return 'info';
    if (key.includes('no publicada') || key.includes('no publicadas')) return 'warning';
    if (key.includes('publicada')) return 'success';
    return undefined;
  }

  private colorMap: Record<string, string> = {
    primary: '#321fdb',
    secondary: '#9da5b1',
    success: '#2eb85c',
    info: '#3399ff',
    warning: '#f9b115',
    danger: '#e55353',
    light: '#ebedef',
    dark: '#4f5d73',
  };

  constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // Slight delay to allow CoreUI to render inner structure
    setTimeout(() => {
      this.applyAdaptiveText();
      this.setupObserver();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['color'] || changes['label']) {
      setTimeout(() => this.applyAdaptiveText(), 0);
    }
    if (changes['value']) {
      this.animateValue();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animateValue() {
    const end = parseFloat(this.value.toString().replace(/,/g, ''));
    if (isNaN(end)) {
      this.displayValue = this.value;
      this.cdr.markForCheck();
      return;
    }

    const start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = Math.floor(start + (end - start) * ease);
      this.displayValue = current;
      this.cdr.markForCheck();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.displayValue = this.value;
        this.cdr.markForCheck();
      }
    };

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private setupObserver() {
    if (!this.kpiBody) return;
    this.observer = new MutationObserver(() => {
      this.applyAdaptiveText();
    });
    this.observer.observe(this.kpiBody.nativeElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style'],
    });
  }

  private applyAdaptiveText() {
    if (!this.kpiBody) return;
    
    // 1. Identificar el elemento que tiene el color de fondo (usualmente .card dentro del widget)
    const cardEl = this.kpiBody.nativeElement.querySelector('.card') as HTMLElement;
    const targetEl = cardEl || this.kpiBody.nativeElement;

    // 2. Determinar el color base
    let hexColor: string | null = null;
    
    // Intentar resolver por el input 'color' si es un nombre conocido
    if (this.resolvedColor && this.colorMap[this.resolvedColor]) {
      hexColor = this.colorMap[this.resolvedColor];
    } 
    // Si no, intentar obtenerlo del estilo computado
    else {
      const bg = this.findEffectiveBackgroundColor(targetEl);
      if (bg) {
        const rgb = this.parseRgb(bg);
        if (rgb) hexColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
      }
    }

    if (!hexColor) return;

    // 3. Estrategia de contraste:
    // Preferimos texto BLANCO para colores oscuros o saturados (Primary, Success, Info, Danger)
    // Preferimos texto NEGRO para colores claros (Warning, Light, Secondary-ish)
    
    const isLightBackground = ['warning', 'light'].includes(this.resolvedColor || '') || 
                              (this.calculateLuminance(hexColor) > 0.5); // Umbral aproximado

    let finalTextColor = '#ffffff';
    let finalBgColor = hexColor;

    if (isLightBackground) {
      finalTextColor = '#000000'; // Negro para fondos claros
      // Verificar contraste con negro
      const contrast = this.getContrast(hexColor, '#000000');
      if (contrast < 4.5) {
        // Si no cumple, aclarar el fondo
        finalBgColor = this.adjustBrightness(hexColor, 20); 
      }
    } else {
      finalTextColor = '#ffffff'; // Blanco para fondos oscuros
      // Verificar contraste con blanco
      const contrast = this.getContrast(hexColor, '#ffffff');
      if (contrast < 4.5) {
        // Si no cumple (ej. Info/Success estándar a veces falla), oscurecer el fondo
        // Oscurecemos iterativamente hasta cumplir
        let adjusted = hexColor;
        for (let i = 0; i < 5; i++) {
          adjusted = this.adjustBrightness(adjusted, -10); // Oscurecer 10%
          if (this.getContrast(adjusted, '#ffffff') >= 4.5) break;
        }
        finalBgColor = adjusted;
      }
    }

    // 4. Aplicar cambios
    // Aplicar color de fondo ajustado si cambió (solo si encontramos el elemento tarjeta)
    if (finalBgColor !== hexColor && cardEl) {
      this.renderer.setStyle(cardEl, 'background-color', finalBgColor);
      this.renderer.setStyle(cardEl, 'border-color', finalBgColor); // Ajustar borde también
    }

    // Aplicar color de texto al contenedor principal y forzar herencia
    this.renderer.setStyle(this.kpiBody.nativeElement, 'color', finalTextColor);
    
    // Aplicar sombra para mejorar legibilidad extra (nivel AAA simulado o 'estético')
    // Sombra suave: negra para texto blanco, blanca (o nula) para texto negro
    if (finalTextColor === '#ffffff') {
      this.renderer.setStyle(this.kpiBody.nativeElement, 'text-shadow', '0 1px 2px rgba(0,0,0,0.25)');
    } else {
      this.renderer.removeStyle(this.kpiBody.nativeElement, 'text-shadow');
    }
    
    // Forzar color en hijos específicos si es necesario (aunque CSS ::ng-deep debería manejarlo)
    if (cardEl) {
        this.renderer.setStyle(cardEl, 'color', finalTextColor);
    }
  }

  // --- Helpers ---

  private getContrast(hexBg: string, hexText: string): number {
    const l1 = this.calculateLuminance(hexBg);
    const l2 = this.calculateLuminance(hexText);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  private calculateLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private adjustBrightness(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const amt = Math.floor(2.55 * percent);
    const r = Math.max(0, Math.min(255, rgb.r + amt));
    const g = Math.max(0, Math.min(255, rgb.g + amt));
    const b = Math.max(0, Math.min(255, rgb.b + amt));
    return this.rgbToHex(r, g, b);
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private findEffectiveBackgroundColor(el: HTMLElement): string | null {
    let node: HTMLElement | null = el;
    for (let i = 0; i < 4 && node; i++) {
      const style = window.getComputedStyle(node);
      const bg = style.backgroundColor;
      if (bg && !this.isTransparent(bg)) return bg;
      node = node.parentElement;
    }
    return null;
  }
  private isTransparent(color: string): boolean {
    return color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
  }
  private parseRgb(color: string): { r: number; g: number; b: number } | null {
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
  }
}
