import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { AvatarModule, BadgeModule, BreadcrumbModule, ButtonGroupModule, ButtonModule, CardModule, DropdownModule, FooterModule, FormModule, GridModule, HeaderModule, ListGroupModule, ModalModule, NavModule, PaginationModule, ProgressModule, SharedModule, SidebarModule, SpinnerModule, TableModule, TabsModule, ToastModule, UtilitiesModule } from '@coreui/angular';
import { ChartjsModule } from '@coreui/angular-chartjs';

import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';
import { ListadoEntradasComponent } from './entradas/listado-entradas.component';
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
import { OpPaginationComponent } from './op-pagination/op-pagination.component';
import { SearchUtilService } from '../../core/services/search-util.service';
import { SharedOPModule } from '../../shared/shared.module';
import { CrearEntradaComponent } from './entradas/crear/crear-entrada.component';
import { EditarEntradaComponent } from './entradas/editar/editar-entrada.component';
import { EntradaFormComponent } from './entradas/entrada-form/entrada-form.component';

@NgModule({
  imports: [
    BaseRoutingModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgScrollbarModule,
    CKEditorModule,
    ChartjsModule,
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
    ModalModule,
    ToastModule,
    SharedOPModule,
  ],
  declarations: [
    BaseComponent,
    ListadoEntradasComponent,
    EntradaFormComponent,
    CrearEntradaComponent,
    EditarEntradaComponent,
    ListadoComentariosComponent,
    CrearEditarComentario,
    ListadoCategoriasComponent,
    CrearEditarCategoria,
    OpPaginationComponent
 //   MyCKEditorComponent
  ],
  providers: [
    DatePipe,
    UsuarioService,
    EntradaService,
    SearchUtilService,
    authInterceptorProviders,
    { provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true },
  ]
})
export class BaseModule { }