import { Injectable } from '@angular/core';

export interface DashboardConfig {
  seriesDays: number;
  seriesGranularity: 'hour' | 'day' | 'week' | 'month';
  topLimit: number;
  topPeriodDays: number;
  recentSize: number;
  estadoNominalChartType: 'line' | 'bar';
  estadoNominalStacked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardConfigService {
  private readonly defaultConfig: DashboardConfig = {
    seriesDays: 30,
    seriesGranularity: 'day',
    topLimit: 10,
    topPeriodDays: 30,
    recentSize: 5,
    estadoNominalChartType: 'bar',
    estadoNominalStacked: true,
  };

  get config(): DashboardConfig {
    // En el futuro, esto podría fusionarse con environment o una respuesta de API
    return { ...this.defaultConfig };
  }
}
