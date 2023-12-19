import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
import { BaseRoutingModule } from './base-routing.module';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, TableModule, TabsModule, UtilitiesModule } from '@coreui/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@coreui/icons-angular';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { CrearEditarEntrada } from './entradas/crear-editar/crear-editar-entrada.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ListadoComentariosComponent } from './comentarios/listado-comentarios.component';
import { CrearEditarComentario } from './comentarios/crear-editar/crear-editar-comentario.component';
import { ListadoCategoriasComponent } from './categorias/listado-categorias.component';
import { CrearEditarCategoria } from './categorias/crear-editar/crear-editar-categoria.component';

@NgModule({
  imports: [
    HttpClientModule,
    CommonModule,
    BaseRoutingModule,
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
  ],
  declarations: [
    ListadoEntradasComponent,
    CrearEditarEntrada,
    ListadoComentariosComponent,
    CrearEditarComentario,
    ListadoCategoriasComponent,
    CrearEditarCategoria
  ],
  exports: [],
  providers: [
    DatePipe,
  ]
})
export class BaseModule { }