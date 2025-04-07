import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { delay } from 'rxjs';

import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';
import { LoadingService } from '../core/services/loading.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  public navItems = navItems;
  public loading$ = this.loader.loading$;
  public loading: boolean = false;
  public cargaFinalizada: boolean = false;

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService,
    public loader: LoadingService
  ) {
    // iconSet singleton
    this.iconSetService.icons = { ...iconSubset };
  }

  ngOnInit(): void {
    this.listenToLoading();
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