import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PerfectScrollbarConfigInterface, PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, SpinnerModule, TableModule, TabsModule, UtilitiesModule } from '@coreui/angular';
import { IconModule, IconSetService } from '@coreui/icons-angular';

import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { CrearEditarEntrada } from './entradas/crear-editar/crear-editar-entrada.component';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { NetworkInterceptor } from 'src/app/core/interceptor/network.interceptor';
import { authInterceptorProviders } from 'src/app/core/interceptor/auth.interceptor';
import { AuthService } from 'src/app/core/services/auth.service';
import { EntradaService } from 'src/app/core/services/entrada.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearEditarCategoria } from './categorias/crear-editar/crear-editar-categoria.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    PerfectScrollbarModule,
    CKEditorModule,
    BaseRoutingModule,
    AvatarModule,
    BadgeModule,
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
    TableModule,
    TabsModule,
    UtilitiesModule,
  ],
  declarations: [
    BaseComponent,
    ListadoEntradasComponent,
    CrearEditarEntrada,
    ListadoComentariosComponent,
    CrearEditarComentario,
    ListadoCategoriasComponent,
    CrearEditarCategoria,
  ],
  providers: [
    DatePipe,
    UsuarioService,
    EntradaService,
    authInterceptorProviders,
    { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
  ]
})
export class BaseModule { }