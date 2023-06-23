import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule, AlertModule, AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, ProgressModule, SidebarModule, SpinnerModule, TabsModule, UtilitiesModule, PaginationModule } from '@coreui/angular';
import { IconModule, IconSetService } from '@coreui/icons-angular';
import { BrowserModule, Title } from '@angular/platform-browser';
import { PerfectScrollbarConfigInterface, PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { AdminComponent } from './admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { DefaultFooterComponent, DefaultHeaderComponent } from './default-layout';
import { UserComponent } from './perfil/user.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './base/dashboard/containers/dashboard.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptorProviders } from '../core/interceptor/auth.interceptor';
import { NetworkInterceptor } from '../core/interceptor/network.interceptor';
import { AuthService } from '../core/services/auth.service';
import { EntradaService } from '../core/services/entrada.service';
import { TokenStorageService } from '../core/services/token-storage.service';
import { UserService } from '../core/services/user.service';
import { ListadoEntradasComponent } from './base/entradas/containers/listado-entradas.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

const APP_CONTAINERS = [
  DefaultFooterComponent,
  DefaultHeaderComponent,
  AdminComponent,
];
 
@NgModule({
  declarations: [APP_CONTAINERS, UserComponent, DashboardComponent],
  imports: [
    AdminRoutingModule,
    AvatarModule,
    BreadcrumbModule,
    FooterModule,
    DropdownModule,
    GridModule,
    HeaderModule,
    SidebarModule,
    IconModule,
    PerfectScrollbarModule,
    NavModule,
    ButtonModule,
    FormModule,
    UtilitiesModule,
    ButtonGroupModule,
    ReactiveFormsModule,
    SidebarModule,
    SharedModule,
    TabsModule,
    ListGroupModule,
    ProgressModule,
    BadgeModule,
    ListGroupModule,
    CardModule,
    PaginationModule
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    IconSetService,
    Title,
    AuthService,
    TokenStorageService,
    UserService,
    EntradaService,
    authInterceptorProviders,
    { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
        
  ],
})
export class AdminModule { }