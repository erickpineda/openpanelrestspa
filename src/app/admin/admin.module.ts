import { LocationStrategy, HashLocationStrategy, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedModule, AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, ProgressModule,  SpinnerModule, TabsModule, UtilitiesModule, PaginationModule, SidebarModule } from '@coreui/angular';
import { IconModule, IconSetService } from '@coreui/icons-angular';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DefaultFooterComponent, DefaultHeaderComponent } from './default-layout';
import { UserComponent } from './perfil/user.component';
import { DashboardComponent } from './base/dashboard/dashboard.component';

import { authInterceptorProviders } from '../core/interceptor/auth.interceptor';
import { NetworkInterceptor } from '../core/interceptor/network.interceptor';
import { AuthService } from '../core/services/auth.service';
import { EntradaService } from '../core/services/entrada.service';
import { TokenStorageService } from '../core/services/token-storage.service';
import { UsuarioService } from '../core/services/usuario.service';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { ChartjsModule } from '@coreui/angular-chartjs';
import { SearchUtilService } from '../core/services/search-util.service';

const APP_CONTAINERS = [
  DefaultFooterComponent,
  DefaultHeaderComponent,
  AdminComponent,
];

@NgModule({
  declarations: [
    ...APP_CONTAINERS,
    UserComponent,
    DashboardComponent
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    IconSetService,
    Title,
    AuthService,
    TokenStorageService,
    UsuarioService,
    EntradaService,
    SearchUtilService,
    authInterceptorProviders,
    { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    //HttpClientModule,
    //FormsModule,
    ReactiveFormsModule,
    NgScrollbarModule,
    AvatarModule,
    BadgeModule,
    ChartjsModule,
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    FooterModule,
    FormModule,
    GridModule,
    HeaderModule,
    IconModule,
    ListGroupModule,
    NavModule,
    PaginationModule,
    ProgressModule,
    SharedModule,
    SidebarModule,
    SpinnerModule,
    TabsModule,
    UtilitiesModule,
  ]
})
export class AdminModule { }