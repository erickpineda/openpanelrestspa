import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import {
  DefaultFooterComponent,
  DefaultHeaderComponent,
} from './default-layout';
import { UserComponent } from './perfil/user.component';
import { DashboardComponent } from './base/dashboard/dashboard.component';

// Módulos externos
import { NgScrollbarModule } from 'ngx-scrollbar';
import { ChartjsModule } from '@coreui/angular-chartjs';

// Shared Module
import { SharedOPModule } from '../shared/shared.module';

const APP_CONTAINERS = [
  DefaultFooterComponent,
  DefaultHeaderComponent,
  AdminComponent,
];

@NgModule({
  declarations: [...APP_CONTAINERS, UserComponent, DashboardComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,

    // ✅ Shared Module (contiene todos los componentes compartidos)
    SharedOPModule,

    // Módulos específicos de Admin
    NgScrollbarModule,
    ChartjsModule,
  ],
})
export class AdminModule {}
