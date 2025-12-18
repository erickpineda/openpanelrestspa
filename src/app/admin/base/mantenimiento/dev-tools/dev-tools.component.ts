import { Component } from '@angular/core';

@Component({
    selector: 'app-mantenimiento-dev-tools',
    templateUrl: './dev-tools.component.html',
    styleUrls: ['./dev-tools.component.scss'],
    standalone: false
})
export class DevToolsComponent {
  features = [
    { name: 'Modo Depuración', enabled: true },
    { name: 'Simular Error', enabled: false },
    { name: 'Restablecer Caché', enabled: false }
  ];

  toggle(feature: any): void { feature.enabled = !feature.enabled; }
}
