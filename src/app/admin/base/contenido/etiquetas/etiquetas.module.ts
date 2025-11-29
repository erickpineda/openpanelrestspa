import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EtiquetasListComponent } from './etiquetas-list.component';
import { EtiquetaFormComponent } from './etiqueta-form/etiqueta-form.component';
import { IconModule } from '@coreui/icons-angular';

@NgModule({
  declarations: [
    EtiquetasListComponent,
    EtiquetaFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconModule
  ],
  exports: [
    EtiquetasListComponent,
    EtiquetaFormComponent
  ]
})
export class EtiquetasModule { }
