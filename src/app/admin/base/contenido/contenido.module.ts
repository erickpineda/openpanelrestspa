import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContenidoRoutingModule } from './contenido-routing.module';
import { ArchivosComponent } from './archivos/archivos.component';
import { FormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';
import { MediaSharedModule } from './media-shared.module';

@NgModule({
  declarations: [ArchivosComponent],
  imports: [
    CommonModule,
    ContenidoRoutingModule,
    SharedOPModule,
    FormsModule,
    MediaSharedModule,
  ],
})
export class ContenidoModule {}
