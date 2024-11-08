import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';
import { LoadingService } from '../core/services/loading.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  public navItems = navItems;

  loading$ = this.loader.loading$;
  loading: boolean = false;
  cargaFinalizada: boolean = false;

  ngOnInit(): void {
    this.listenToLoading();
  }

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    public loader: LoadingService
  ) {
    // iconSet singleton
    iconSetService.icons = { ...iconSubset };
  }

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };

  listenToLoading(): void {
    this.loader.loadingSub
      .pipe(delay(0)) // This prevents a ExpressionChangedAfterItHasBeenCheckedError for subsequent requests
      .subscribe((loading) => {
        this.loading = loading;
        if (loading === false) {
          this.cargaFinalizada = true;
        }
      });
  }
  

}
