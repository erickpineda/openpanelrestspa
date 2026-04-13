import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '@shared/components/icons/coreui-icons';
import { ThemeRuntimeService } from './services/theme-runtime.service';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
  standalone: false,
})
export class PublicComponent implements OnInit {
  currentTheme = 'light'; // Por defecto. Podríamos enlazarlo a un servicio de Theme.

  constructor(
    private iconSetService: IconSetService,
    private route: ActivatedRoute,
    private themeRuntime: ThemeRuntimeService
  ) {
    this.iconSetService.icons = { ...iconSubset };
  }
  ngOnInit() {
    // Aplicar tema público (active o preview) al entrar en la app pública.
    this.themeRuntime.initFromRoute(this.route).subscribe();
  }
}
