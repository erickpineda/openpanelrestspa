import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EntradasRoutingModule } from './entradas-routing.module';
import { EntradasSharedModule } from './entradas-shared.module';

// Módulos externos usados por entradas
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { MediaSharedModule } from '@app/admin/base/contenido/media-shared.module';

// Componentes principales (desde ubicación original por ahora)
import { ListadoEntradasComponent } from '@app/admin/base/entradas/listado-entradas.component';
import { CrearEntradaComponent } from '@app/admin/base/entradas/crear/crear-entrada.component';
import { EditarEntradaComponent } from '@app/admin/base/entradas/editar/editar-entrada.component';
import { EntradasPendientesComponent } from '@app/admin/base/entradas/pendientes/entradas-pendientes.component';

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
    MediaSharedModule
  ],
  declarations: [
    ListadoEntradasComponent,
    CrearEntradaComponent,
    EditarEntradaComponent,
    EntradasPendientesComponent
  ],
})
export class EntradasModule {}
