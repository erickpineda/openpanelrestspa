import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoRoutingModule } from './contenido-routing.module';
import { ImagenesComponent } from './imagenes/imagenes.component';
import { ArchivosComponent } from './archivos/archivos.component';
import { EtiquetasModule } from './etiquetas/etiquetas.module';
import { IconModule } from '@coreui/icons-angular';

@NgModule({
  declarations: [ImagenesComponent, ArchivosComponent],
  imports: [
    CommonModule,
    ContenidoRoutingModule,
    IconModule,
    EtiquetasModule
  ]
})
export class ContenidoModule {}
