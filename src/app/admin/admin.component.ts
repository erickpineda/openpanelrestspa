import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { delay } from 'rxjs';

import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';
import { LoadingService } from '../core/services/loading.service';
import { TemporaryStorageService } from '../core/services/temporary-storage.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
   // ✅ NUEVO: Propiedades para controlar la notificación
  showGlobalRecoveryNotification = false;
  temporaryEntriesCount = 0;

  public navItems = navItems;
  public loading$ : any;
  public loading: boolean = false;
  public cargaFinalizada: boolean = false;

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    public loader: LoadingService,
    private temporaryStorage: TemporaryStorageService,
  ) {
    // iconSet singleton
    this.iconSetService.icons = { ...iconSubset };
  }

  ngOnInit(): void {
    this.loading$ = this.loader.loading$
    this.listenToLoading();
    // Verificar datos temporales solo cuando ya estamos autenticados en el admin
    this.checkForTemporaryData();
  }

  private checkForTemporaryData(): void {
    const temporaryEntries = this.temporaryStorage.getAllTemporaryEntries();
    this.temporaryEntriesCount = temporaryEntries.length;
    
    if (this.temporaryEntriesCount > 0) {
      console.log('📥 Datos temporales encontrados en admin:', temporaryEntries);
      
      setTimeout(() => {
        this.showGlobalRecoveryNotification = true;
      }, 1000);
    }
  }

  // ✅ NUEVO: Métodos para manejar las acciones
  onGlobalRecover(): void {
    this.showGlobalRecoveryNotification = false;
    this.router.navigate(['/admin/control/entradas/crear']);
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

  private listenToLoading(): void {
    this.loader.loadingSub
      .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
      .subscribe((loading) => {
        this.loading = loading;
        this.cargaFinalizada = !loading;
      });
  }
}