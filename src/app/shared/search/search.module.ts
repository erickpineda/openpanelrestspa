import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedCoreUiModule } from '../shared-coreui.module';
import { SharedOPModule } from '../shared.module';
import { OpSearchBasicComponent } from './widgets/op-search-basic.component';
import { SearchStoreService } from './search-store.service';

@NgModule({
  imports: [CommonModule, FormsModule, SharedCoreUiModule, SharedOPModule],
  declarations: [OpSearchBasicComponent],
  providers: [SearchStoreService],
  exports: [OpSearchBasicComponent, SharedOPModule],
})
export class SharedSearchModule {}
