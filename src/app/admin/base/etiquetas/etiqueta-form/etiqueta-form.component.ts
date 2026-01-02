import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EtiquetaService } from '../../../../core/services/data/etiqueta.service';
import { Etiqueta } from '../../../../core/models/etiqueta.model';
import { ToastService } from '../../../../core/services/ui/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-etiqueta-form',
  templateUrl: './etiqueta-form.component.html',
  styleUrls: ['./etiqueta-form.component.scss'],
  standalone: false,
})
export class EtiquetaFormComponent implements OnInit, OnChanges {
  @Input() etiqueta: Etiqueta | null = null;
  @Input() isEdit = false;
  @Output() save = new EventEmitter<Etiqueta>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  loading = false;

  colores = [
    { value: '#FF6B6B', label: 'Rojo' },
    { value: '#4ECDC4', label: 'Turquesa' },
    { value: '#45B7D1', label: 'Azul' },
    { value: '#96CEB4', label: 'Verde' },
    { value: '#FFEAA7', label: 'Amarillo' },
    { value: '#DDA0DD', label: 'Morado' },
    { value: '#FFB347', label: 'Naranja' },
    { value: '#F8BBD9', label: 'Rosa' },
  ];

  constructor(
    private fb: FormBuilder,
    private etiquetasService: EtiquetaService,
    private toast: ToastService,
    private log: LoggerService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(200)],
      colorHex: ['#4ECDC4', Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.isEdit && this.etiqueta) {
      this.form.patchValue({
        nombre: this.etiqueta.nombre,
        descripcion: this.etiqueta.descripcion,
        colorHex: this.etiqueta.colorHex || '#4ECDC4',
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['etiqueta'] || changes['isEdit']) {
      if (this.isEdit && this.etiqueta) {
        this.form.patchValue({
          nombre: this.etiqueta.nombre,
          descripcion: this.etiqueta.descripcion,
          colorHex: this.etiqueta.colorHex || '#4ECDC4',
        });
      } else {
        this.form.reset({
          nombre: '',
          descripcion: '',
          colorHex: '#4ECDC4',
        });
      }
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      const etiquetaData: Etiqueta = { ...this.form.value } as Etiqueta;
      const operation =
        this.isEdit && this.etiqueta?.idEtiqueta
          ? this.etiquetasService.actualizar(this.etiqueta.idEtiqueta, etiquetaData)
          : this.etiquetasService.crear(etiquetaData);
      operation.subscribe({
        next: () => {
          this.loading = false;
          this.toast.showSuccess(
            this.isEdit ? 'Etiqueta actualizada' : 'Etiqueta creada',
            'Etiquetas'
          );
          this.save.emit({
            ...etiquetaData,
            idEtiqueta: this.etiqueta?.idEtiqueta,
          } as Etiqueta);
        },
        error: (error: any) => {
          this.toast.showError('Error guardando etiqueta', 'Etiquetas');
          this.log.error('etiquetas guardar', error);
          this.loading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getColorPreviewStyle(color: string): any {
    return {
      'background-color': color,
      width: '20px',
      height: '20px',
      'border-radius': '50%',
      display: 'inline-block',
      'margin-right': '8px',
    };
  }
}
