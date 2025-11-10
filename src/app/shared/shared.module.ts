import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// CoreUI Modules
import {
    AlertModule,
  AvatarModule,
  BadgeModule,
  BreadcrumbModule,
  ButtonGroupModule,
  ButtonModule,
  CardModule,
  DropdownModule,
  FooterModule,
  FormModule,
  GridModule,
  HeaderModule,
  ListGroupModule,
  ModalModule,
  NavbarModule,
  NavModule,
  PaginationModule,
  ProgressModule,
  SidebarModule,
  SpinnerModule,
  TableModule,
  TabsModule,
  ToastModule,
  UtilitiesModule,
} from '@coreui/angular';

// Componentes compartidos
import { NotFoundComponent } from './components/not-found/not-found.component';
import { BuscadorAvanzadoComponent } from './components/buscador-avanzado/buscador-avanzado.component';
import { OpPaginationComponent } from './components/op-pagination/op-pagination.component';
import { DataRecoveryNotificationComponent } from './components/data-recovery-notification/data-recovery-notification.component';
import { IconModule } from '@coreui/icons-angular';
import { TemporaryEntriesManagerComponent } from './components/temporary-entries-manager/temporary-entries-manager.component';
import { OpLoaderComponent } from './components/loading/op-loader.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component';
import { ToastsContainerComponent } from './components/op-toast/toasts-container.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // CoreUI Modules
    AlertModule,
    AvatarModule,
    BadgeModule,
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    FooterModule,
    FormModule,
    GridModule,
    HeaderModule,
    IconModule,
    ListGroupModule,
    ModalModule,
    NavModule,
    NavbarModule,
    PaginationModule,
    ProgressModule,
    SidebarModule,
    SpinnerModule,
    TableModule,
    TabsModule,
    ToastModule,
    UtilitiesModule,
  ],
  declarations: [
    NotFoundComponent,
    BuscadorAvanzadoComponent,
    OpPaginationComponent,
    DataRecoveryNotificationComponent, // ✅ Agregado aquí
    TemporaryEntriesManagerComponent,
    OpLoaderComponent,
    ConfirmationModalComponent,
    ToastsContainerComponent
  ],
  exports: [
    // Módulos Angular
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // CoreUI Modules
    AlertModule,
    AvatarModule,
    BadgeModule,
    BreadcrumbModule,
    ButtonGroupModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    FooterModule,
    FormModule,
    GridModule,
    HeaderModule,
    IconModule,
    ListGroupModule,
    ModalModule,
    NavModule,
    NavbarModule,
    PaginationModule,
    ProgressModule,
    SidebarModule,
    SpinnerModule,
    TableModule,
    TabsModule,
    ToastModule,
    UtilitiesModule,

    // Componentes compartidos
    NotFoundComponent,
    BuscadorAvanzadoComponent,
    OpPaginationComponent,
    DataRecoveryNotificationComponent, // ✅ Exportado aquí
    TemporaryEntriesManagerComponent,
    OpLoaderComponent,
    ConfirmationModalComponent,
    ToastsContainerComponent
  ],
})
export class SharedOPModule {}
