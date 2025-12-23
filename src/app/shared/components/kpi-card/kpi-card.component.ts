import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KpiCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtitle?: string;
  @Input() iconName?: string;
  @Input() color?: string;

  get resolvedIcon(): string {
    if (this.iconName) return this.iconName;
    const key = (this.label || '').toLowerCase();
    if (key.includes('usuario')) return 'cilUser';
    if (key.includes('entrada')) return 'cilNotes';
    if (key.includes('no publicada') || key.includes('no publicadas'))
      return 'cilXCircle';
    if (key.includes('publicada')) return 'cilCheckCircle';
    return 'cilSpeedometer';
  }

  get resolvedColor(): string | undefined {
    if (this.color) return this.color;
    const key = (this.label || '').toLowerCase();
    if (key.includes('usuario')) return 'primary';
    if (key.includes('entrada')) return 'info';
    if (key.includes('no publicada') || key.includes('no publicadas'))
      return 'warning';
    if (key.includes('publicada')) return 'success';
    return undefined;
  }
}
