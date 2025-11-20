import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedOPModule } from '../../../shared/shared.module';
import { ChartjsModule } from '@coreui/angular-chartjs';

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, DashboardRoutingModule, SharedOPModule, ChartjsModule]
})
export class DashboardModule {}
