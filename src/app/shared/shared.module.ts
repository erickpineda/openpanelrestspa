import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlertModule, BadgeModule, ButtonModule, CardModule, GridModule, ListGroupModule, PaginationModule, FormModule, DropdownModule, NavModule, HeaderModule, ModalModule, SpinnerModule } from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

import { NotFoundComponent } from './components/not-found/not-found.component';
import { BuscadorAvanzadoComponent } from './components/buscador-avanzado/buscador-avanzado.component';
import { OpPaginationComponent } from './components/op-pagination/op-pagination.component';
import { GlobalErrorComponent } from './components/errors/global/global-error.component';
import { ErrorBoundaryComponent } from './components/errors/error-boundary/error-boundary.component';
import { SharedWidgetsModule } from './shared-widgets.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AlertModule,
    BadgeModule,
    ButtonModule,
    HeaderModule,
    CardModule,
    ModalModule,
    SpinnerModule,
    DropdownModule,
    GridModule,
    ListGroupModule,
    NavModule,
    PaginationModule,
    FormModule,
    IconModule,
    SharedWidgetsModule
  ],
  declarations: [
    GlobalErrorComponent,
    NotFoundComponent,
    ErrorBoundaryComponent,
    BuscadorAvanzadoComponent,
    OpPaginationComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AlertModule,
    BadgeModule,
    ButtonModule,
    HeaderModule,
    CardModule,
    ModalModule,
    SpinnerModule,
    DropdownModule,
    GridModule,
    ListGroupModule,
    NavModule,
    PaginationModule,
    FormModule,
    IconModule,
    GlobalErrorComponent,
    NotFoundComponent,
    ErrorBoundaryComponent,
    BuscadorAvanzadoComponent,
    OpPaginationComponent,
    SharedWidgetsModule
  ]
})
export class SharedOPModule {}
