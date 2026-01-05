import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import { SharedCoreUiModule } from './shared-coreui.module';
import { ChartjsModule } from '@coreui/angular-chartjs';
import { OpLoaderComponent } from './components/loading/op-loader.component';
import { InlineLoaderComponent } from './components/loading/inline-loader.component';
import { ToastsContainerComponent } from './components/op-toast/toasts-container.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { DataRecoveryNotificationComponent } from './components/data-recovery-notification/data-recovery-notification.component';
import { TemporaryEntriesManagerComponent } from './components/temporary-entries-manager/temporary-entries-manager.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { DashboardChartComponent } from './components/dashboard-chart/dashboard-chart.component';
import { TranslatePipe } from './pipes/translate.pipe';

@NgModule({
  imports: [CommonModule, IconModule, SharedCoreUiModule, ChartjsModule, TranslatePipe],
  declarations: [
    OpLoaderComponent,
    InlineLoaderComponent,
    ToastsContainerComponent,
    ConfirmationModalComponent,
    DataRecoveryNotificationComponent,
    TemporaryEntriesManagerComponent,
    KpiCardComponent,
    DashboardChartComponent,
  ],
  exports: [
    SharedCoreUiModule,
    IconModule,
    OpLoaderComponent,
    InlineLoaderComponent,
    ToastsContainerComponent,
    ConfirmationModalComponent,
    DataRecoveryNotificationComponent,
    TemporaryEntriesManagerComponent,
    KpiCardComponent,
    DashboardChartComponent,
  ],
})
export class SharedWidgetsModule {}
