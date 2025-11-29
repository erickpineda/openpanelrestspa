import { Component, OnInit } from '@angular/core';
import { TemasService } from '../../../../core/services/data/temas.service';
import { Tema } from '../../../../core/models/tema.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-temas',
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.scss']
})
export class TemasComponent implements OnInit {
  loading = false;
  error: string | null = null;
  temas: Tema[] = [];
  modalVisible = false;
  editItem: Tema | null = null;
  form: FormGroup;

  constructor(private temasService: TemasService, private fb: FormBuilder, private toast: ToastService, private log: LoggerService) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      activo: ['false', Validators.required],
      esquemaColor: ['', Validators.maxLength(50)]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = null;
    this.temasService.listarTemasSafe().subscribe({
      next: (list: Tema[]) => { this.temas = Array.isArray(list) ? list : []; this.loading = false; },
      error: (err) => { this.error = 'Error cargando temas'; this.log.error('temas listar', err); this.loading = false; }
    });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ nombre: '', activo: 'false', esquemaColor: '' });
    this.modalVisible = true;
  }

  openEdit(item: Tema): void {
    this.editItem = { ...item };
    this.form.reset({
      nombre: item.nombre || '',
      activo: String(item.activo ? 'true' : 'false'),
      esquemaColor: item.esquemaColor || ''
    });
    this.modalVisible = true;
  }

  closeModal(): void { this.modalVisible = false; this.editItem = null; }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload: Tema = {
      nombre: this.form.value.nombre,
      activo: this.form.value.activo === 'true',
      esquemaColor: this.form.value.esquemaColor
    };
    const op = this.editItem?.id ? this.temasService.actualizarSafe(this.editItem.id, payload) : this.temasService.crearSafe(payload);
    op.subscribe({
      next: () => { this.toast.showSuccess('Tema guardado', 'Temas'); this.loading = false; this.modalVisible = false; this.load(); },
      error: (err) => { this.toast.showError('Error guardando', 'Temas'); this.log.error('temas guardar', err); this.loading = false; }
    });
  }

  delete(item: Tema): void {
    if (!item.id) return;
    if (!confirm('¿Eliminar tema?')) return;
    this.loading = true;
    this.temasService.eliminarSafe(item.id).subscribe({
      next: () => { this.toast.showSuccess('Tema eliminado', 'Temas'); this.loading = false; this.load(); },
      error: (err) => { this.toast.showError('Error eliminando', 'Temas'); this.log.error('temas eliminar', err); this.loading = false; }
    });
  }
}
