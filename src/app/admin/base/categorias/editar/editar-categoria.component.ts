import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Categoria } from '../../../../core/models/categoria.model';
import { CategoriaFacadeService } from '../categoria-form/srv/categoria-facade.service';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-editar-categoria',
  templateUrl: './editar-categoria.component.html',
  standalone: false
})
export class EditarCategoriaComponent {
  @Input() visible = false;
  @Input() categoria?: Categoria;
  @Input() listaCategorias: Categoria[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(CategoriaFormComponent) formComponent!: CategoriaFormComponent;

  constructor(
    private facade: CategoriaFacadeService,
    private toastService: ToastService
  ) {}

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  guardar(cat: Categoria) {
    if (!cat.idCategoria) return;
    
    this.facade.actualizarCategoria(cat.idCategoria, cat).subscribe({
      next: () => {
        this.toastService.showSuccess('La categoría se ha modificado correctamente.', 'Categoría modificada');
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al actualizar la categoría:', err);
        if (this.formComponent) {
          this.formComponent.onError.emit();
        }
      }
    });
  }
}
