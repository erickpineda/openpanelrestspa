import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Categoria } from '@app/core/models/categoria.model';
import { CategoriaFacadeService } from '../categoria-form/srv/categoria-facade.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-crear-categoria',
  templateUrl: './crear-categoria.component.html',
  standalone: false
})
export class CrearCategoriaComponent {
  @Input() visible = false;
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
    this.facade.crearCategoria(cat).subscribe({
      next: () => {
        this.toastService.showSuccess('La categoría se ha creado correctamente.', 'Categoría creada');
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: (err) => {
        if (this.formComponent) {
          this.formComponent.onError.emit();
        }
      }
    });
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
