import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'usuarios/crear', component: UsuarioFormComponent },
  { path: 'usuarios/editar/:id', component: UsuarioFormComponent },
  { path: 'roles', component: RolesListComponent },
  { path: 'roles/crear', component: RolFormComponent },
  { path: 'roles/editar/:id', component: RolFormComponent },
  { path: 'privilegios', component: PrivilegiosListComponent },
  { path: 'privilegios/crear', component: PrivilegioFormComponent },
  { path: 'privilegios/editar/:id', component: PrivilegioFormComponent },
  { path: 'privilegios/eliminar/:id', component: EliminarPrivilegioComponent },
  { path: 'roles/eliminar/:id', component: EliminarRolComponent },
  { path: 'perfil', component: MiPerfilComponent },
  { path: 'password', component: ChangePasswordComponent },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionFeatureRoutingModule {}
