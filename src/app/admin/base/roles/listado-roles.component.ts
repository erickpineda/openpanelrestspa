import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from '../../../core/services/logger.service';
import { RolService } from '../../../core/services/data/rol.service';
import { Rol } from '../../../core/models/rol.model';

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
    private router: Router,
    private log: LoggerService
  ) { }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(page: number = 0): void {
    this.rolService.listarPagina(page, this.pageSize)
      .subscribe({
        next: (data: any) => {
          this.roles = data.data;
          this.currentPage = page;
        },
        error: (error: any) => this.log.error('Error cargando roles:', error)
      });
  }

  onPageChange(page: number): void {
    this.cargarRoles(page - 1);
  }

  eliminarRol(id: number): void {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      this.rolService.borrar(id).subscribe({
        next: () => this.cargarRoles(),
        error: (error: any) => this.log.error('Error eliminando rol:', error)
      });
    }
  }
}