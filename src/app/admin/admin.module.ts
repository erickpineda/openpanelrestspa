import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DefaultFooterComponent, DefaultHeaderComponent } from './default-layout';

// Módulos externos
import { NgScrollbarModule } from 'ngx-scrollbar';
// Dashboard moved to lazy DashboardModule (includes Chartjs)

// Shared Module
import { SharedCoreUiModule } from '../shared/shared-coreui.module';
import { SharedWidgetsModule } from '../shared/shared-widgets.module';

const APP_CONTAINERS = [DefaultFooterComponent, DefaultHeaderComponent, AdminComponent];

@NgModule({
  declarations: [...APP_CONTAINERS],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,

    // Solo los módulos CoreUI necesarios para el layout
    SharedCoreUiModule,
    // Widgets y notificaciones compartidas
    SharedWidgetsModule,

    // Módulos específicos de Admin (Dashboard/Chartjs se cargan en su propio módulo)
    NgScrollbarModule,
  ],
})
export class AdminModule {}
