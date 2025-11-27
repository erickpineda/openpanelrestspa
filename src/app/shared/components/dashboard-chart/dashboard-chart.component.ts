import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-dashboard-chart',
  templateUrl: './dashboard-chart.component.html',
  styleUrls: ['./dashboard-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardChartComponent {
  @Input() data: any = { labels: [], datasets: [] };
  @Input() type: 'line' | 'bar' | 'doughnut' | 'pie' = 'line';
  @Input() options: any;
}
