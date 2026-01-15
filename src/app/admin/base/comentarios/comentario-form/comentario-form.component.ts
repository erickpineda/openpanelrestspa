import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comentario } from '../../../../core/models/comentario.model';
import { ComentarioFacadeService } from './srv/comentario-facade.service';
import { Entrada } from '../../../../core/models/entrada.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-comentario-form',
  templateUrl: './comentario-form.component.html',
  styleUrls: ['./comentario-form.component.scss'],
  standalone: false,
})
export class ComentarioFormComponent implements OnChanges {
  @Input() comentario?: Comentario;
  @Input() nombreUsuario?: string;
  @Input() emailUsuario?: string;
  @Input() tituloEntrada?: string;

  @Input() submitted = false;
  @Input() disabled = false; // Para modo ver/editar
  @Input() isEditMode = false; // Para saber si estamos en modo edición (vs crear)

  @Output() submitComentario = new EventEmitter<Comentario>();
  @Output() cancel = new EventEmitter<void>();
  @Output() editarComentario = new EventEmitter<void>(); // Solicitud de habilitar edición
  @Output() goToEntry = new EventEmitter<number>();

  form: FormGroup;
  searchResults: Entrada[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private facade: ComentarioFacadeService
  ) {
    this.form = this.fb.group({
      idComentario: [null],
      idEntrada: [null, Validators.required],
      idUsuario: [null],
      username: [null], // Readonly display
      tituloEntrada: [null], // Searchable in create
      email: [null], // Readonly display
      aprobado: [false],
      cuarentena: [false],
      votos: [null],
      fechaCreacion: [null],
      fechaEdicion: [null],
      contenido: [null, Validators.required],
      contenidoCensurado: [null],
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => this.facade.buscarEntradas(term))
    ).subscribe((results) => {
      this.searchResults = results;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comentario'] && this.comentario) {
      this.form.patchValue(this.comentario);
    }

    if (changes['nombreUsuario'] && this.nombreUsuario) {
      this.form.get('username')?.setValue(this.nombreUsuario);
    }

    if (changes['emailUsuario'] && this.emailUsuario) {
      this.form.get('email')?.setValue(this.emailUsuario);
    }

    if (changes['tituloEntrada'] && this.tituloEntrada) {
      this.form.get('tituloEntrada')?.setValue(this.tituloEntrada);
    }

    if (changes['disabled']) {
      if (this.disabled) {
        this.form.disable();
      } else {
        this.form.enable();
        // Si estamos editando, quizás queramos mantener ciertos campos deshabilitados
        // como username, email, fechas, etc.
        // Pero por ahora enable() habilita todo, luego deshabilitamos lo que no se debe tocar
        this.disableReadonlyFields();
      }
    }
  }

  onSearchInput(event: any) {
    if (this.isEditMode) return;
    
    // Al escribir, invalidamos la selección anterior
    this.form.patchValue({ idEntrada: null }, { emitEvent: false });

    const term = event.target.value;
    if (term.length > 2) {
      this.searchSubject.next(term);
    } else {
      this.searchResults = [];
    }
  }

  seleccionarEntrada(entrada: Entrada) {
    this.form.patchValue({
      idEntrada: entrada.idEntrada,
      tituloEntrada: entrada.titulo
    });
    this.searchResults = [];
  }

  irAEntrada() {
    const idEntrada = this.form.get('idEntrada')?.value;
    if (idEntrada) {
      this.goToEntry.emit(idEntrada);
    }
  }

  private disableReadonlyFields() {
    const readonlyFields = [
      'username',
      'email',
      // 'tituloEntrada', // Allow in create
      'votos',
      'fechaCreacion',
      'fechaEdicion',
      'idComentario',
      // 'idEntrada', // Need to set it
      'idUsuario',
    ];
    readonlyFields.forEach((field) => {
      this.form.get(field)?.disable();
    });
    
    // Always disable contenidoCensurado
    this.form.get('contenidoCensurado')?.disable();

    if (this.isEditMode) {
      this.form.get('tituloEntrada')?.disable();
      this.form.get('idEntrada')?.disable();
    } else {
       this.form.get('tituloEntrada')?.enable();
    }
  }

  get f() {
    return this.form.controls;
  }

  guardar() {
    if (this.form.valid) {
      // Emitimos el valor del form, mezclado con el ID original si es necesario
      // Ojo: getRawValue() incluye los campos deshabilitados
      const formValue = this.form.getRawValue();

      // Asegurar que los IDs críticos estén presentes si no vienen del form
      if (!formValue.idComentario && this.comentario?.idComentario) {
        formValue.idComentario = this.comentario.idComentario;
      }
      if (!formValue.idEntrada && this.comentario?.idEntrada) {
        formValue.idEntrada = this.comentario.idEntrada;
      }
      if (!formValue.idUsuario && this.comentario?.idUsuario) {
        formValue.idUsuario = this.comentario.idUsuario;
      }

      this.submitComentario.emit(formValue);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  handleEditarComentario() {
    this.editarComentario.emit();
    this.form.enable();
    this.disableReadonlyFields();
  }
}
