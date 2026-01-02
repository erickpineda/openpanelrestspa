import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DefaultFooterComponent, DefaultHeaderComponent } from './default-layout';

// Módulos externos
import { NgScrollbarModule } from 'ngx-scrollbar';
import { SidebarModule, GridModule, HeaderModule, NavModule, AvatarModule, BadgeModule, BreadcrumbModule, DropdownModule, ListGroupModule, FooterModule } from '@coreui/angular';
// Dashboard moved to lazy DashboardModule (includes Chartjs)

// Shared Module
    import { SharedOPModule } from '../shared/shared.module';
    import { SharedCoreUiModule } from '../shared/shared-coreui.module';
    import { SharedWidgetsModule } from '../shared/shared-widgets.module';

    const APP_CONTAINERS = [DefaultFooterComponent, DefaultHeaderComponent, AdminComponent];

    @NgModule({
      declarations: [...APP_CONTAINERS],
      imports: [
        CommonModule,
        AdminRoutingModule,
        ReactiveFormsModule,

        // CoreUI Modules Explicit Import (to resolve linter errors)
        SidebarModule,
        GridModule,
        HeaderModule,
        NavModule,
        AvatarModule,
        BadgeModule,
        BreadcrumbModule,
        DropdownModule,
        ListGroupModule,
        FooterModule,

        // Shared Modules
        SharedOPModule,
        SharedCoreUiModule,
        SharedWidgetsModule,

        // Módulos específicos de Admin (Dashboard/Chartjs se cargan en su propio módulo)
        NgScrollbarModule,
      ],
    })
export class AdminModule {}
