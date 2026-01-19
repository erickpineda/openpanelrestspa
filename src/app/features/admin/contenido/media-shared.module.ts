import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedOPModule } from '../../../shared/shared.module';
import { ImagenesComponent } from './imagenes/imagenes.component';

@NgModule({
  declarations: [ImagenesComponent],
  imports: [CommonModule, FormsModule, SharedOPModule],
  exports: [ImagenesComponent],
})
export class MediaSharedModule {}
