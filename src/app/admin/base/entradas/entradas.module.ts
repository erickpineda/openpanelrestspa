import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { EntradasRoutingModule } from './entradas-routing.module';
import { ListadoEntradasComponent } from './listado-entradas.component';
import { CrearEntradaComponent } from './crear/crear-entrada.component';
import { EditarEntradaComponent } from './editar/editar-entrada.component';
import { EntradaFormComponent } from './entrada-form/entrada-form.component';
import { PreviaEntradaComponent } from './previa/preview-entrada.component';

// Módulos externos usados por entradas
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';
import { MediaSharedModule } from '../contenido/media-shared.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EntradasRoutingModule,

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
    EntradaFormComponent,
    PreviaEntradaComponent,
  ]
})
export class EntradasModule {}
