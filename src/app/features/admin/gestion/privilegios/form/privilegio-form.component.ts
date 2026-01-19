import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Privilegio } from '../../../../../core/models/privilegio.model';
import { TranslationService } from '../../../../../core/services/translation.service';

@Component({
  selector: 'app-privilegio-form',
  templateUrl: './privilegio-form.component.html',
  standalone: false,
})
export class PrivilegioFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() privilegio: Privilegio | null = null;
  @Input() isEditing = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSave = new EventEmitter<Privilegio>();
  disabled = false;
  constructor(private translate: TranslationService) { }
  manualCodeEntry = false;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      if (this.isEditing) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
    }
  }
  enableEdit() {
    this.disabled = false;
  }
  close() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
  save() {
    if (this.isFormValid() && this.privilegio) {
      this.onSave.emit(this.privilegio);
    }
  }
  isFormValid(): boolean {
    return !!(
      this.privilegio &&
      this.privilegio.nombre &&
      this.privilegio.nombre.trim().length > 0 &&
      this.privilegio.codigo &&
      this.privilegio.codigo.trim().length > 0
    );
  }
  onNombreInput(value: string): void {
    if (!this.privilegio) return;
    this.privilegio.nombre = value;
    if (!this.isEditing && !this.manualCodeEntry) {
      this.generateCodeFromNombre(value);
    }
  }
  onCodigoInput(value: string): void {
    if (!this.privilegio) return;
    this.privilegio.codigo = value.toUpperCase();
    this.manualCodeEntry = true;
  }
  private generateCodeFromNombre(nombre: string): void {
    if (!this.privilegio) return;
    let code = nombre.replace(/\s/g, '').substring(0, 10).toUpperCase();
    this.privilegio.codigo = code;
  }
}
