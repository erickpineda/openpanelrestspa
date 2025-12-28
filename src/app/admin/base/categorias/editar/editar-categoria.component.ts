import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriaFacadeService } from '../categoria-form/srv/categoria-facade.service';
import { Categoria } from '../../../../core/models/categoria.model';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { ToastService } from '../../../../core/services/ui/toast.service';

@Component({
  selector: 'app-editar-categoria',
  templateUrl: './editar-categoria.component.html',
  styleUrls: ['./editar-categoria.component.scss'],
  standalone: false,
})
export class EditarCategoriaComponent implements OnInit {
  categoria?: Categoria;
  listaCategorias: Categoria[] = [];
  submitted = false;
  formDisabled = true;

  constructor(
    private route: ActivatedRoute,
    private facade: CategoriaFacadeService,
    private router: Router,
    private commonFuncService: CommonFunctionalityService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['idCategoria']);
    this.facade.obtenerCategoriaPorId(id).subscribe((cat) => {
      this.categoria = cat || undefined;
      this.formDisabled = true;
    });
    this.facade.obtenerListaCategorias().subscribe((cats) => (this.listaCategorias = cats));
  }

  editar(cat: Categoria) {
    if (!cat.idCategoria) return;
    this.facade.actualizarCategoria(cat.idCategoria, cat).subscribe({
      next: () => {
        this.toastService.showSuccess(
          'La categoría se ha modificado correctamente.',
          'Categoría modificada'
        );
        this.commonFuncService.reloadComponent(false, '/admin/control/categorias');
      },
      error: (err) => {
        console.error('Error al actualizar la categoría:', err);
        // Emitir evento de error al componente hijo
        const form = document.querySelector('app-categoria-form') as any;
        form?.onError.emit();
      },
    });
  }

  onReset() {
    this.submitted = false;
    this.formDisabled = true;
    this.router.navigate(['/admin/control/categorias']);
  }

  onValidate() {
    this.submitted = true;
  }

  habilitarEdicion() {
    this.formDisabled = false;
  }
}
