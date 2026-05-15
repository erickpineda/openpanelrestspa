import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '@shared/components/icons/coreui-icons';
import { SystemSettingsRuntimeService } from '@app/core/services/data/system-settings-runtime.service';
import { ThemeRuntimeService } from './services/theme-runtime.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.scss'],
  standalone: false,
})
export class PublicComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentTheme = 'light'; // Por defecto. Podríamos enlazarlo a un servicio de Theme.

  constructor(
    private iconSetService: IconSetService,
    private route: ActivatedRoute,
    private themeRuntime: ThemeRuntimeService,
    private systemSettingsRuntime: SystemSettingsRuntimeService
  ) {
    this.iconSetService.icons = { ...iconSubset };
  }
  ngOnInit() {
    this.systemSettingsRuntime.loadPublicSettings().pipe(takeUntil(this.destroy$)).subscribe();
    this.themeRuntime.initFromRoute(this.route).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
