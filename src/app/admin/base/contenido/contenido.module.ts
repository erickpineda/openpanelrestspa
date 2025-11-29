import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoRoutingModule } from './contenido-routing.module';
import { ImagenesComponent } from './imagenes/imagenes.component';
import { ArchivosComponent } from './archivos/archivos.component';
import { FormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [ImagenesComponent, ArchivosComponent],
  imports: [
    CommonModule,
    ContenidoRoutingModule,
    SharedOPModule,
    FormsModule
  ]
})
export class ContenidoModule {}
