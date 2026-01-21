import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { SharedCoreUiModule } from '@shared/shared-coreui.module';
import { SharedWidgetsModule } from '@shared/shared-widgets.module';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { GestionFeatureRoutingModule } from './gestion-routing.module';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { UsuarioFormComponent } from './usuarios/form/usuario-form.component';
import { CrearUsuarioComponent } from './usuarios/crear/crear-usuario.component';
import { EditarUsuarioComponent } from './usuarios/editar/editar-usuario.component';
import { EliminarUsuarioComponent } from './usuarios/eliminar/eliminar-usuario.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { RolFormComponent } from './roles/form/rol-form.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { PrivilegioFormComponent } from './privilegios/form/privilegio-form.component';
import { EliminarPrivilegioComponent } from './privilegios/eliminar/eliminar-privilegio.component';
import { EliminarRolComponent } from './roles/eliminar/eliminar-rol.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';
import { ChangePasswordComponent } from './password/change-password.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedOPModule,
    SharedCoreUiModule,
    SharedWidgetsModule,
    TranslatePipe,
    GestionFeatureRoutingModule,
  ],
  declarations: [
    UsuariosListComponent,
    UsuarioFormComponent,
    CrearUsuarioComponent,
    EditarUsuarioComponent,
    RolesListComponent,
    RolFormComponent,
    PrivilegiosListComponent,
    PrivilegioFormComponent,
    EliminarPrivilegioComponent,
    EliminarRolComponent,
    EliminarUsuarioComponent,
    MiPerfilComponent,
    ChangePasswordComponent,
  ],
})
export class GestionFeatureModule {}
