import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Rol } from 'src/app/core/models/rol.model';
import { RolService } from 'src/app/core/services/rol.service';

@Component({
  selector: 'app-listado-roles',
  templateUrl: './listado-roles.component.html',
  styleUrls: ['./listado-roles.component.scss'],
})
export class ListadoRolesComponent implements OnInit {
  roles: Rol[] = [];
  currentPage = 0;
  pageSize = 20;
  totalItems = 0;

  constructor(
    private rolService: RolService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(page: number = 0): void {
    this.rolService.listarPagina(page, this.pageSize)
      .subscribe({
        next: (data) => {
          this.roles = data.data;
          this.currentPage = page;
        },
        error: (error) => console.error('Error cargando roles:', error)
      });
  }

  onPageChange(page: number): void {
    this.cargarRoles(page - 1);
  }

  eliminarRol(id: number): void {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      this.rolService.borrar(id).subscribe({
        next: () => this.cargarRoles(),
        error: (error) => console.error('Error eliminando rol:', error)
      });
    }
  }
}