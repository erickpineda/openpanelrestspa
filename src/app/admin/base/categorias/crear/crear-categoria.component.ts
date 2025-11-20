import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Categoria } from '../../../../core/models/categoria.model';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { CategoriaFacadeService } from '../categoria-form/srv/categoria-facade.service';
import { ToastService } from '../../../../core/services/ui/toast.service';

@Component({
  selector: 'app-crear-categoria',
  templateUrl: './crear-categoria.component.html',
  styleUrls: ['./crear-categoria.component.scss']
})
export class CrearCategoriaComponent implements OnInit {
  listaCategorias: Categoria[] = [];
  submitted = false;

  constructor(
    private facade: CategoriaFacadeService,
    private router: Router,
    private commonFuncService: CommonFunctionalityService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.facade.obtenerListaCategorias().subscribe(cats => this.listaCategorias = cats);
  }

  crear(cat: Categoria) {
    this.facade.crearCategoria(cat).subscribe({
      next: () => {
        this.toastService.showSuccess('La categoría se ha creado correctamente.', 'Categoría creada');
        this.commonFuncService.reloadComponent(false, '/admin/control/categorias');
      },
      error: (err) => {
        console.error('Error al crear la categoría:', err);
        // Emitir evento de error al componente hijo
        const form = document.querySelector('app-categoria-form') as any;
        form?.onError.emit();
      }
    });
  }

  onReset() {
    this.submitted = false;
    this.router.navigate(['/admin/control/categorias']);
  }

  onValidate() {
    this.submitted = true;
  }
}
