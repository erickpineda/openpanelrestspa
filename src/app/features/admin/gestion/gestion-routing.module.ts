import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuarioIdRedirectGuard } from './usuarios/guards/usuario-id-redirect.guard';
import { UsuariosListComponent } from './usuarios/listado-usuarios.component';
import { UsuarioFormComponent } from './usuarios/form/usuario-form.component';
import { RolesListComponent } from './roles/listado-roles.component';
import { RolFormComponent } from './roles/form/rol-form.component';
import { PrivilegiosListComponent } from './privilegios/listado-privilegios.component';
import { PrivilegioFormComponent } from './privilegios/form/privilegio-form.component';
import { EliminarPrivilegioComponent } from './privilegios/eliminar/eliminar-privilegio.component';
import { EliminarRolComponent } from './roles/eliminar/eliminar-rol.component';
import { MiPerfilComponent } from './perfil/mi-perfil.component';

import { RolIdRedirectGuard } from './roles/guards/rol-id-redirect.guard';
import { PrivilegioIdRedirectGuard } from './privilegios/guards/privilegio-id-redirect.guard';

const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'usuarios/crear', component: UsuarioFormComponent },
  { path: 'usuarios/editar/username/:username', component: UsuarioFormComponent },
  {
    path: 'usuarios/editar/:id',
    component: UsuarioFormComponent,
    canActivate: [UsuarioIdRedirectGuard],
  },
  { path: 'roles', component: RolesListComponent },
  { path: 'roles/crear', component: RolFormComponent },
  { path: 'roles/editar/codigo/:codigo', component: RolFormComponent },
  { path: 'roles/editar/:id', component: RolFormComponent, canActivate: [RolIdRedirectGuard] },
  { path: 'privilegios', component: PrivilegiosListComponent },
  { path: 'privilegios/crear', component: PrivilegioFormComponent },
  { path: 'privilegios/editar/codigo/:codigo', component: PrivilegioFormComponent },
  {
    path: 'privilegios/editar/:id',
    component: PrivilegioFormComponent,
    canActivate: [PrivilegioIdRedirectGuard],
  },
  { path: 'privilegios/eliminar/codigo/:codigo', component: EliminarPrivilegioComponent },
  {
    path: 'privilegios/eliminar/:id',
    component: EliminarPrivilegioComponent,
    canActivate: [PrivilegioIdRedirectGuard],
  },
  { path: 'roles/eliminar/codigo/:codigo', component: EliminarRolComponent },
  {
    path: 'roles/eliminar/:id',
    component: EliminarRolComponent,
    canActivate: [RolIdRedirectGuard],
  },
  { path: 'perfil', component: MiPerfilComponent },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionFeatureRoutingModule {}
