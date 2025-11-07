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
    
    if (temporaryEntries.length > 0) {
      console.log('📥 Datos temporales encontrados en admin:', temporaryEntries);
      
      // Esperar un poco para que la UI se cargue completamente
      setTimeout(() => {
        const shouldRecover = confirm(
          `Tienes ${temporaryEntries.length} entrada(s) no guardada(s) de sesiones anteriores. ¿Deseas recuperarlas ahora?`
        );
        
        if (shouldRecover) {
          // Navegar a la página de creación de entradas
          this.router.navigate(['/admin/control/entradas/crear']);
        } else {
          // Opcional: preguntar si quiere descartar los datos
          const shouldDiscard = confirm('¿Deseas descartar estos datos permanentemente?');
          if (shouldDiscard) {
            this.temporaryStorage.clearAllTemporaryEntries();
          }
        }
      }, 1000);
    }
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