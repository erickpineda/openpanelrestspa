import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { EtiquetasRoutingModule } from './etiquetas-routing.module';
import { EtiquetasListComponent } from './etiquetas-list.component';
import { EtiquetaFormComponent } from './etiqueta-form/etiqueta-form.component';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [EtiquetasListComponent, EtiquetaFormComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedOPModule, EtiquetasRoutingModule]
})
export class EtiquetasModule {}
