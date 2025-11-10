import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';

import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';
import { TemporaryStorageService } from '../core/services/ui/temporary-storage.service';

// ... imports existentes

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  // ✅ NUEVO: Propiedades para controlar la notificación
  showGlobalRecoveryNotification = false;
  temporaryEntriesCount = 0;

  public navItems = navItems;
  public cargaFinalizada: boolean = false;

  // Propiedades para el componente de recuperación
  showRecoveryNotification = false;
  recoveryData: any[] = [];

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    private temporaryStorage: TemporaryStorageService
  ) {
    this.iconSetService.icons = { ...iconSubset };
  }

  ngOnInit(): void {
    this.checkForTemporaryData();
  }

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getAllTemporaryEntries();
    this.temporaryEntriesCount = temporaryEntries.length;
    
    if (this.temporaryEntriesCount > 0) {
      console.log('📥 Datos temporales encontrados en admin:', temporaryEntries);
      
      // ✅ MODIFICADO: Siempre mostrar notificación múltiple, incluso con una sola entrada
      this.showGlobalRecoveryNotification = true;
    }
  }

  onRecoverData(): void {
    this.showRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  // ✅ MODIFICADO: Siempre redirigir al listado de entradas temporales
  onGlobalRecover(): void {
    this.showGlobalRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/entradas-temporales']);
  }

  onGlobalIgnore(): void {
    this.showGlobalRecoveryNotification = false;
    console.log('ℹ️ Usuario ignoró la notificación global de recuperación');
  }

  onGlobalDiscard(): void {
    this.showGlobalRecoveryNotification = false;
    this.temporaryStorage.clearAllTemporaryEntries();
    console.log('🗑️ Usuario descartó todos los datos temporales');
  }
}
