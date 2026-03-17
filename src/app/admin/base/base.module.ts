import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BaseRoutingModule } from './base-routing.module';
import { BaseComponent } from './base.component';
import { BaseIndexComponent } from './base-index.component';

import { SharedOPModule } from '../../shared/shared.module';
import { SharedCoreUiModule } from '../../shared/shared-coreui.module';
import { SharedWidgetsModule } from '../../shared/shared-widgets.module';

@NgModule({
  imports: [
    BaseRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // ✅ Shared Module (contiene componentes compartidos)
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
  ],
  declarations: [BaseComponent, BaseIndexComponent],
})
export class BaseModule {}
