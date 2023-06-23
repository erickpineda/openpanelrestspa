import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { ListadoEntradasComponent } from './entradas/containers/listado-entradas.component';
import { BaseRoutingModule } from './base-routing.module';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, TableModule, TabsModule, UtilitiesModule } from '@coreui/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@coreui/icons-angular';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { VerEditarEntrada } from './entradas/components/ver-editar/ver-editar-entrada.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

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
    CKEditorModule
  ],
  declarations: [
    ListadoEntradasComponent,
    VerEditarEntrada
  ],
  exports: [],
  providers: [

  ]
})
export class BaseModule { }