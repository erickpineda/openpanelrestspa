import { Component, OnInit } from '@angular/core';
import { AjustesService } from '../../../../core/services/data/ajustes.service';
import { Ajustes } from '../../../../core/models/ajustes.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss']
})
export class AjustesComponent implements OnInit {
  loading = false;
  error: string | null = null;
  ajustes: Ajustes[] = [];
  modalVisible = false;
  editItem: Ajustes | null = null;
  form: FormGroup;

  constructor(private ajustesService: AjustesService, private fb: FormBuilder, private toast: ToastService, private log: LoggerService) {
    this.form = this.fb.group({
      categoria: ['', [Validators.required, Validators.maxLength(50)]],
      clave: ['', [Validators.required, Validators.maxLength(50)]],
      valor: ['', [Validators.required, Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = null;
    this.ajustesService.listarAjustesSafe().subscribe({
      next: (list: Ajustes[]) => { this.ajustes = Array.isArray(list) ? list : []; this.loading = false; },
      error: (err) => { this.error = 'Error cargando ajustes'; this.log.error('ajustes listar', err); this.loading = false; }
    });
  }

  openNew(): void {
    this.editItem = null;
    this.form.reset({ categoria: '', clave: '', valor: '' });
    this.modalVisible = true;
  }

  openEdit(item: Ajustes): void {
    this.editItem = { ...item };
    this.form.reset({ categoria: item.categoria || '', clave: item.clave || '', valor: item.valor || '' });
    this.modalVisible = true;
  }

  closeModal(): void { this.modalVisible = false; this.editItem = null; }

  save(): void {
    if (this.form.invalid) return;
    this.loading = true;
    const payload: Ajustes = { ...this.form.value };
    const op = this.editItem?.id ? this.ajustesService.actualizarSafe(this.editItem.id, payload) : this.ajustesService.crearSafe(payload);
    op.subscribe({
      next: () => { this.toast.showSuccess('Ajuste guardado', 'Ajustes'); this.loading = false; this.modalVisible = false; this.load(); },
      error: (err) => { this.toast.showError('Error guardando', 'Ajustes'); this.log.error('ajustes guardar', err); this.loading = false; }
    });
  }

  delete(item: Ajustes): void {
    if (!item.id) return;
    if (!confirm('¿Eliminar ajuste?')) return;
    this.loading = true;
    this.ajustesService.eliminarSafe(item.id).subscribe({
      next: () => { this.toast.showSuccess('Ajuste eliminado', 'Ajustes'); this.loading = false; this.load(); },
      error: (err) => { this.toast.showError('Error eliminando', 'Ajustes'); this.log.error('ajustes eliminar', err); this.loading = false; }
    });
  }
}
