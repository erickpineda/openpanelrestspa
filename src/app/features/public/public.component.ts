import { Component, OnInit } from '@angular/core';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '@shared/components/icons/coreui-icons';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
  standalone: false,
})
export class PublicComponent implements OnInit {
  currentTheme = 'light'; // Por defecto. Podríamos enlazarlo a un servicio de Theme.

  constructor(private iconSetService: IconSetService) {
    this.iconSetService.icons = { ...iconSubset };
  }
  ngOnInit() {}
}
