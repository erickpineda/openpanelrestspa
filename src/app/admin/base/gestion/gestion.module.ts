import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GestionRoutingModule } from './gestion-routing.module';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { UsuarioFormComponent } from './usuarios/form/usuario-form.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { RolFormComponent } from './roles/form/rol-form.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { PrivilegioFormComponent } from './privilegios/form/privilegio-form.component';
import { EliminarPrivilegioComponent } from './privilegios/eliminar/eliminar-privilegio.component';
import { EliminarRolComponent } from './roles/eliminar/eliminar-rol.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';
import { SharedOPModule } from '../../../shared/shared.module';
import { SharedCoreUiModule } from '../../../shared/shared-coreui.module';
import {
  CardModule,
  GridModule,
  ButtonModule,
  FormModule,
  TableModule,
  BadgeModule,
  SpinnerModule,
  AlertModule,
  ModalModule,
  TooltipModule
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

@NgModule({
  declarations: [
    UsuariosListComponent,
    UsuarioFormComponent,
    RolesListComponent,
    RolFormComponent,
    PrivilegiosListComponent,
    PrivilegioFormComponent,
    EliminarPrivilegioComponent,
    EliminarRolComponent,
    MiPerfilComponent,
    ChangePasswordComponent,
  ],
  imports: [
    CommonModule,
    GestionRoutingModule,
    SharedOPModule,
    SharedCoreUiModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    GridModule,
    ButtonModule,
    FormModule,
    TableModule,
    BadgeModule,
    SpinnerModule,
    AlertModule,
    ModalModule,
    TooltipModule,
    IconModule
  ],
})
export class GestionModule { }
