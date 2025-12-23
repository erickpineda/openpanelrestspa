import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-perfil-activity',
  templateUrl: './perfil-activity.component.html',
  styleUrls: ['./perfil-activity.component.scss'],
  standalone: false,
})
export class PerfilActivityComponent implements OnInit {
  @Input() usuarioId: number = 0;

  activities: any[] = [];

  ngOnInit(): void {
    // Mock activities
    this.activities = [
      {
        action: 'Inicio de sesión exitoso',
        date: new Date(),
        ip: '192.168.1.1',
        device: 'Chrome on Windows',
      },
      {
        action: 'Actualización de foto de perfil',
        date: new Date(Date.now() - 3600000 * 5),
        ip: '192.168.1.1',
        device: 'Chrome on Windows',
      },
      {
        action: 'Cambio de configuración de tema',
        date: new Date(Date.now() - 86400000),
        ip: '192.168.1.1',
        device: 'Firefox on Linux',
      },
      {
        action: 'Cierre de sesión',
        date: new Date(Date.now() - 172800000),
        ip: '10.0.0.5',
        device: 'Safari on iPhone',
      },
    ];
  }

  trackByActivity(index: number, activity: any): string {
    const time =
      activity?.date instanceof Date
        ? activity.date.getTime()
        : new Date(activity?.date).getTime();
    return `${activity?.action || ''}-${time}-${activity?.ip || ''}-${activity?.device || ''}`;
  }
}
