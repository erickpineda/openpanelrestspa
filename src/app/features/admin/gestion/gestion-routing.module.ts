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
import { UserRole } from '../../../shared/types/navigation.types';

const routes: Routes = [
  {
    path: 'usuarios',
    component: UsuariosListComponent,
    data: { roles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'usuarios/crear',
    component: UsuarioFormComponent,
    data: { roles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'usuarios/editar/username/:username',
    component: UsuarioFormComponent,
    data: { roles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'usuarios/editar/:id',
    component: UsuarioFormComponent,
    canActivate: [UsuarioIdRedirectGuard],
    data: { roles: [UserRole.ADMINISTRADOR, UserRole.PROPIETARIO] },
  },
  {
    path: 'roles',
    component: RolesListComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'roles/crear',
    component: RolFormComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'roles/editar/codigo/:codigo',
    component: RolFormComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'roles/editar/:id',
    component: RolFormComponent,
    canActivate: [RolIdRedirectGuard],
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios',
    component: PrivilegiosListComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios/crear',
    component: PrivilegioFormComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios/editar/codigo/:codigo',
    component: PrivilegioFormComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios/editar/:id',
    component: PrivilegioFormComponent,
    canActivate: [PrivilegioIdRedirectGuard],
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios/eliminar/codigo/:codigo',
    component: EliminarPrivilegioComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'privilegios/eliminar/:id',
    component: EliminarPrivilegioComponent,
    canActivate: [PrivilegioIdRedirectGuard],
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'roles/eliminar/codigo/:codigo',
    component: EliminarRolComponent,
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'roles/eliminar/:id',
    component: EliminarRolComponent,
    canActivate: [RolIdRedirectGuard],
    data: { roles: [UserRole.PROPIETARIO] },
  },
  {
    path: 'perfil',
    component: MiPerfilComponent,
    data: {
      roles: [
        UserRole.LECTOR,
        UserRole.AUTOR,
        UserRole.EDITOR,
        UserRole.ADMINISTRADOR,
        UserRole.DESARROLLADOR,
        UserRole.MANTENIMIENTO,
        UserRole.PROPIETARIO,
      ],
    },
  },
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GestionFeatureRoutingModule {}
