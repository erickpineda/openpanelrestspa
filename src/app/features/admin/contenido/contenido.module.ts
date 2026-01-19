import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { MediaSharedModule } from './media-shared.module';
import { ContenidoFeatureRoutingModule } from './contenido-routing.module';
import { ArchivosComponent } from './archivos/archivos.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedOPModule,
    MediaSharedModule,
    ContenidoFeatureRoutingModule,
  ],
  declarations: [ArchivosComponent],
})
export class ContenidoFeatureModule {}
