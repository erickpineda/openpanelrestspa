import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedSearchModule } from '@shared/search/search.module';
import {
  EntradasFilterComponent,
  EntradasTableComponent,
  PreviaEntradaComponent,
} from './components';
import { EntradaFormComponent,
} from './entrada-form/entrada-form.component';
import { EntradaEtiquetasComponent } from './entrada-form/components/entrada-etiquetas/entrada-etiquetas.component';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { MediaSharedModule } from '@features/admin/contenido/media-shared.module';

@NgModule({
  declarations: [
    EntradasFilterComponent,
    EntradasTableComponent,
    PreviaEntradaComponent,
    EntradaFormComponent,
    EntradaEtiquetasComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CKEditorModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    SharedSearchModule,
    MediaSharedModule,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    SharedSearchModule,
    EntradasFilterComponent,
    EntradasTableComponent,
    PreviaEntradaComponent,
    EntradaFormComponent,
  ],
})
export class EntradasSharedModule {}
