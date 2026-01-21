import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';

@Component({
  selector: 'app-perfil-form',
  templateUrl: './perfil-form.component.html',
  styleUrls: ['./perfil-form.component.scss'],
  standalone: false,
})
export class PerfilFormComponent implements OnInit, OnChanges {
  @Input() usuario: PerfilResponse | null = null;
  @Output() save = new EventEmitter<any>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('^[0-9]+$')]],
      website: [''],
    });
  }

  ngOnInit(): void {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && !changes['usuario'].firstChange) {
      this.updateForm();
    }
  }

  private updateForm(): void {
    if (this.usuario) {
      this.form.patchValue({
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        email: this.usuario.email,
        telefono: this.usuario.telefono,
        website: this.usuario.website,
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
