import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedCoreuiModule } from '../shared-coreui.module';
import { BuscadorAvanzadoComponent } from '../components/buscador-avanzado/buscador-avanzado.component';
import { OpSearchBasicComponent } from './widgets/op-search-basic.component';
import { SearchStoreService } from './search-store.service';

@NgModule({
  imports: [CommonModule, FormsModule, SharedCoreuiModule],
  declarations: [OpSearchBasicComponent],
  providers: [SearchStoreService],
  exports: [OpSearchBasicComponent, BuscadorAvanzadoComponent],
})
export class SharedSearchModule {}
