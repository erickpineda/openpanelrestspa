import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';
import { MediaSharedModule } from '../contenido/media-shared.module';
import { RouterModule } from '@angular/router';

import { EntradaFormComponent } from './entrada-form/entrada-form.component';
import { PreviaEntradaComponent } from './previa/preview-entrada.component';
import { EntradasTableComponent } from './components/entradas-table/entradas-table.component';
import { EntradasFilterComponent } from './components/entradas-filter/entradas-filter.component';

@NgModule({
  declarations: [
    EntradaFormComponent, 
    PreviaEntradaComponent,
    EntradasTableComponent,
    EntradasFilterComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CKEditorModule,
    SharedOPModule,
    SharedCoreUiModule,
    MediaSharedModule,
    RouterModule,
  ],
  exports: [
    EntradaFormComponent,
    PreviaEntradaComponent,
    EntradasTableComponent,
    EntradasFilterComponent,
    // Re-export modules useful for consumers if needed,
    // but usually better to keep explicit.
    // However, since we are splitting EntradasModule, let's keep it simple.
  ],
})
export class EntradasSharedModule {}
