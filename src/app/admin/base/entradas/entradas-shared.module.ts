import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';
import { MediaSharedModule } from '../contenido/media-shared.module';

import { EntradaFormComponent } from './entrada-form/entrada-form.component';
import { PreviaEntradaComponent } from './previa/preview-entrada.component';

@NgModule({
  declarations: [
    EntradaFormComponent,
    PreviaEntradaComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CKEditorModule,
    SharedOPModule,
    SharedCoreUiModule,
    MediaSharedModule
  ],
  exports: [
    EntradaFormComponent,
    PreviaEntradaComponent,
    // Re-export modules useful for consumers if needed, 
    // but usually better to keep explicit. 
    // However, since we are splitting EntradasModule, let's keep it simple.
  ]
})
export class EntradasSharedModule {}
