import { Component, OnInit } from '@angular/core';
import { TranslationService } from '@app/core/services/translation.service';

@Component({
  selector: 'app-forgot-password-public',
  templateUrl: './forgot-password-public.component.html',
  styleUrls: ['./forgot-password-public.component.scss'],
  standalone: false,
})
export class ForgotPasswordPublicComponent implements OnInit {
  identifier = '';
  visibleDevModal = false;

  constructor(private translation: TranslationService) {
    this.translation.refresh();
  }

  ngOnInit(): void {}

  submit(): void {
    this.visibleDevModal = true;
  }
}
