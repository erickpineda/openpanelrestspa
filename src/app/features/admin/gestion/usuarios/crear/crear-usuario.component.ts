import { Component, EventEmitter, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { Usuario } from '@app/core/models/usuario.model';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { ToastService } from '@app/core/services/ui/toast.service';
import { UsuarioFormComponent } from '../form/usuario-form.component';
import { Rol } from '@app/core/models/rol.model';
import { TranslationService } from '@app/core/services/translation.service';

@Component({
  selector: 'app-crear-usuario',
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.scss'],
  standalone: false
})
export class CrearUsuarioComponent implements OnChanges {
  @Input() visible = false;
  @Input() roles: Rol[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSuccess = new EventEmitter<void>();

  @ViewChild(UsuarioFormComponent) formComponent!: UsuarioFormComponent;

  loading = false;

  constructor(
    private usuarioService: UsuarioService,
    private toastService: ToastService,
    private translate: TranslationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.formComponent) {
        this.formComponent.resetForm();
      }
    }
  }

  handleVisibleChange(event: boolean) {
    this.visible = event;
    this.visibleChange.emit(event);
  }

  cerrarModal() {
    this.handleVisibleChange(false);
  }

  guardar(usuario: Usuario) {
    this.loading = true;
    this.usuarioService.crear(usuario).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.showSuccess(
          this.translate.instant('ADMIN.USERS.SUCCESS.CREATE'),
          this.translate.instant('COMMON.SUCCESS')
        );
        this.onSuccess.emit();
        this.cerrarModal();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error al crear usuario:', err);
        this.toastService.showError(
          this.translate.instant('ADMIN.USERS.ERROR.CREATE'),
          this.translate.instant('COMMON.ERROR')
        );
      }
    });
  }

  onGuardarClick() {
    this.formComponent.guardar();
  }
}
