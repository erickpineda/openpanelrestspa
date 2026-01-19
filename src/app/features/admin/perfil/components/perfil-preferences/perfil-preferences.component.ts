import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PerfilResponse } from '../../../../../core/models/perfil-response.model';

@Component({
  selector: 'app-perfil-preferences',
  templateUrl: './perfil-preferences.component.html',
  styleUrls: ['./perfil-preferences.component.scss'],
  standalone: false,
})
export class PerfilPreferencesComponent implements OnInit {
  @Input() usuario: PerfilResponse | null = null;
  @Output() save = new EventEmitter<any>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      theme: ['light'],
      language: ['es'],
      notifications: [true],
    });
  }

  ngOnInit(): void {
    if (this.usuario && this.usuario.infouser) {
      try {
        const prefs = JSON.parse(this.usuario.infouser);
        this.form.patchValue(prefs);
      } catch (e) {
        // Ignore if not valid json
      }
    }
  }

  onSubmit() {
    const infouser = JSON.stringify(this.form.value);
    this.save.emit({ infouser });
  }
}
