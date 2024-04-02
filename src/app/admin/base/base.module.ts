import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, HashLocationStrategy, LocationStrategy } from '@angular/common';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { BaseRoutingModule } from './base-routing.module';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, SpinnerModule, TableModule, TabsModule, UtilitiesModule } from '@coreui/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule, IconSetService } from '@coreui/icons-angular';
import { PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface, PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { CrearEditarEntrada } from './entradas/crear-editar/crear-editar-entrada.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { NetworkInterceptor } from 'src/app/core/interceptor/network.interceptor';
import { BaseComponent } from './base.component';
import { Title } from 'chart.js';
import { authInterceptorProviders } from 'src/app/core/interceptor/auth.interceptor';
import { AuthService } from 'src/app/core/services/auth.service';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';

@NgModule({
  imports: [
    BaseRoutingModule,
    HttpClientModule,
    CommonModule,
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
    TableModule,
    PaginationModule,
    FormsModule,
    CKEditorModule,
    SpinnerModule,
  ],
  declarations: [
    BaseComponent,
    ListadoEntradasComponent,
    CrearEditarEntrada,
    ListadoComentariosComponent,
    CrearEditarComentario
  ],
  exports: [],
  providers: [
    DatePipe,
    UsuarioService,
    EntradaService,
    authInterceptorProviders,
    { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
  ]
})
export class BaseModule { }