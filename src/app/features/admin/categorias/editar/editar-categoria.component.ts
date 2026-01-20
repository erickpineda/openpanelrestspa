import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Categoria } from '@app/core/models/categoria.model';
import { CategoriaFacadeService } from '../categoria-form/srv/categoria-facade.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-editar-categoria',
  templateUrl: './editar-categoria.component.html',
  standalone: false,
})
export class EditarCategoriaComponent implements OnChanges {
  @Input() visible = false;
  @Input() categoria?: Categoria;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(CategoriaFormComponent) formComponent!: CategoriaFormComponent;

  disabled = true;

  constructor(
    private facade: CategoriaFacadeService,
    private toastService: ToastService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.disabled = true;
    }
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  guardar(cat: Categoria) {
    if (!cat.codigo && !cat.idCategoria) return;
    const obs = cat.codigo
      ? this.facade.actualizarCategoriaPorCodigo(cat.codigo, cat)
      : this.facade.actualizarCategoria(cat.idCategoria, cat);
    obs.subscribe({
      next: () => {
        this.toastService.showSuccess(
          'La categoría se ha modificado correctamente.',
          'Categoría modificada'
        );
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: () => {
        this.toastService.showError('Error al actualizar la categoría.', 'Error');
        if (this.formComponent) {
          this.formComponent.onError.emit();
        }
      },
    });
  }

  onEditarCategoria() {
    this.disabled = false;
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
