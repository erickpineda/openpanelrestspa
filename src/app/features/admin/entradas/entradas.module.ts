import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { DatePipe, AsyncPipe } from '@angular/common';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { MediaSharedModule } from '@features/admin/contenido/media-shared.module';
import { EntradasRoutingModule } from './entradas-routing.module';
import { EntradasSharedModule } from './entradas-shared.module';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { EntradasPendientesComponent } from './pendientes/entradas-pendientes.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    EntradasRoutingModule,
    EntradasSharedModule,
    // Shared y CKEditor sólo para este módulo
    SharedOPModule,
    CKEditorModule,
    SharedCoreUiModule,
    MediaSharedModule,
    DatePipe,
    AsyncPipe,
  ],
  declarations: [
    ListadoEntradasComponent,
    CrearEntradaComponent,
    EditarEntradaComponent,
    EntradasPendientesComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EntradasModule {}
