import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedCoreUiModule } from '../shared/shared-coreui.module';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DefaultFooterComponent, DefaultHeaderComponent } from './default-layout';
import { RightSidebarComponent } from './default-layout/right-sidebar/right-sidebar.component';

// Módulos externos
import { NgScrollbarModule } from 'ngx-scrollbar';

// Shared Module
import { SharedOPModule } from '../shared/shared.module';

const APP_CONTAINERS = [DefaultFooterComponent, DefaultHeaderComponent, AdminComponent, RightSidebarComponent];

@NgModule({
  declarations: [...APP_CONTAINERS],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    SharedCoreUiModule,

    // Shared Modules (SharedOPModule exports SharedWidgetsModule & SharedCoreUiModule)
    SharedOPModule,

    // Módulos específicos de Admin
    NgScrollbarModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminModule {}
