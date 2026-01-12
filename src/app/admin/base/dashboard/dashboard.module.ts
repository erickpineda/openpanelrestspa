import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardToolbarComponent } from './components/dashboard-toolbar/dashboard-toolbar.component';
import { DashboardSeriesPanelComponent } from './components/dashboard-series-panel/dashboard-series-panel.component';
import { DashboardTopPanelComponent } from './components/dashboard-top-panel/dashboard-top-panel.component';
import { DashboardRecentPanelComponent } from './components/dashboard-recent-panel/dashboard-recent-panel.component';
import { DashboardStoragePanelComponent } from './components/dashboard-storage-panel/dashboard-storage-panel.component';
import { DashboardContentPanelComponent } from './components/dashboard-content-panel/dashboard-content-panel.component';
import { DashboardEstadoNominalPanelComponent } from './components/dashboard-estado-nominal-panel/dashboard-estado-nominal-panel.component';
import { DashboardEstadoSplitPanelComponent } from './components/dashboard-estado-split-panel/dashboard-estado-split-panel.component';
import { DashboardSettingsModalComponent } from './components/dashboard-settings-modal/dashboard-settings-modal.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedOPModule } from '../../../shared/shared.module';
import { ChartjsModule } from '@coreui/angular-chartjs';

@NgModule({
  declarations: [
    DashboardComponent,
    DashboardToolbarComponent,
    DashboardSeriesPanelComponent,
    DashboardTopPanelComponent,
    DashboardRecentPanelComponent,
    DashboardStoragePanelComponent,
    DashboardContentPanelComponent,
    DashboardEstadoNominalPanelComponent,
    DashboardEstadoSplitPanelComponent,
    DashboardSettingsModalComponent,
  ],
  imports: [CommonModule, DashboardRoutingModule, SharedOPModule, ChartjsModule],
})
export class DashboardModule {}
