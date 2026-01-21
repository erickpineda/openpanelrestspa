import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import {
  EntradasFilterComponent,
  EntradasTableComponent,
  PreviaEntradaComponent,
} from './components';
import { EntradaFormComponent } from './entrada-form/entrada-form.component';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { MediaSharedModule } from '@features/admin/contenido/media-shared.module';

@NgModule({
  declarations: [
    EntradasFilterComponent,
    EntradasTableComponent,
    PreviaEntradaComponent,
    EntradaFormComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CKEditorModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    MediaSharedModule,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    EntradasFilterComponent,
    EntradasTableComponent,
    PreviaEntradaComponent,
    EntradaFormComponent,
  ],
})
export class EntradasSharedModule {}
