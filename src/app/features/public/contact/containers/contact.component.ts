import { Component, OnInit } from '@angular/core';
import { ToastService } from '@app/core/services/ui/toast.service';
import { TranslationService } from '@app/core/services/translation.service';
import { SharedOPModule } from '@shared/shared.module';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  standalone: true,
  imports: [SharedOPModule],
})
export class ContactComponent implements OnInit {
  model = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private toast: ToastService,
    private i18n: TranslationService
  ) {}
  ngOnInit(): void {}

  buildMailtoHref(): string {
    const subject = `Contacto OpenPanel - ${this.model.name}`.trim();
    const bodyLines = [
      `Nombre: ${this.model.name}`,
      `Email: ${this.model.email}`,
      this.model.phone ? `Teléfono: ${this.model.phone}` : '',
      '',
      this.model.message,
    ].filter((l) => l !== '');
    const body = bodyLines.join('\n');

    const to = '';
    const params = new URLSearchParams({
      subject,
      body,
    });
    return `mailto:${to}?${params.toString()}`;
  }

  submit(): void {
    const name = this.model.name.trim();
    const email = this.model.email.trim();
    const message = this.model.message.trim();
    if (!name || !email || !message) return;

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const href = this.buildMailtoHref();
      window.location.href = href;
      const msg = this.i18n.translate('PUBLIC.CONTACT.SUCCESS_MESSAGE');
      this.successMessage = msg;
      this.toast.showSuccess(msg);
    } catch {
      const msg = this.i18n.translate('PUBLIC.CONTACT.ERROR_MESSAGE');
      this.errorMessage = msg;
      this.toast.showError(msg);
    } finally {
      this.isSubmitting = false;
    }
  }
}
