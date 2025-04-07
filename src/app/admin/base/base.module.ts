import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, SpinnerModule, TableModule, TabsModule, UtilitiesModule } from '@coreui/angular';


import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { CrearEditarEntrada } from './entradas/crear-editar/crear-editar-entrada.component';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearEditarCategoria } from './categorias/crear-editar/crear-editar-categoria.component';
import { authInterceptorProviders } from '../../core/interceptor/auth.interceptor';
import { NetworkInterceptor } from '../../core/interceptor/network.interceptor';
import { IconModule } from '@coreui/icons-angular';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { EntradaService } from '../../core/services/entrada.service';
import { UsuarioService } from '../../core/services/usuario.service';

@NgModule({
  imports: [
    BaseRoutingModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgScrollbarModule,
    CKEditorModule,
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
 //   MyCKEditorComponent
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