// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp
  ): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Then we find all the tests (compatibilidad Webpack 5 / Firefox headless)
import './app/app.component.spec';
import './app/core/errors/error-boundary/error-boundary.service.spec';
import './app/core/interceptor/network.interceptor.spec';
import './app/core/models/privilegio.model.spec';
import './app/core/preloading/custom-preloading-strategy.service.spec';
import './app/core/services/dashboard-api.service.spec';
import './app/core/services/i18n-integrity.spec';
import './app/core/services/logger-buffer.service.spec';
import './app/core/services/logger.service.spec';
import './app/core/services/auth/auth-sync.service.spec';
import './app/core/services/auth/auth.service.spec';
import './app/core/services/auth/post-login-redirect.service.spec';
import './app/core/services/auth/route-tracker.service.spec';
import './app/core/services/auth/session-manager.service.spec';
import './app/core/services/auth/token-storage.service.spec';
import './app/core/services/data/categoria.service.spec';
import './app/core/services/data/comentario.service.extra.spec';
import './app/core/services/data/comentario.service.spec';
import './app/core/services/data/entrada-catalog.service.spec';
import './app/core/services/data/entrada.service.extra.spec';
import './app/core/services/data/entrada.service.spec';
import './app/core/services/data/estado-entrada.service.spec';
import './app/core/services/data/etiqueta.service.spec';
import './app/core/services/data/plantilla-email.service.spec';
import './app/core/services/data/rol.service.spec';
import './app/core/services/data/tipo-entrada.service.spec';
import './app/core/services/data/usuario.service.spec';
import './app/core/services/srv-busqueda/busqueda.service.spec';
import './app/core/services/ui/active-section.service.spec';
import './app/core/services/ui/badge-counter.service.spec';
import './app/core/services/ui/loading.service.spec';
import './app/core/services/ui/navigation-performance.service.spec';
import './app/core/services/ui/navigation.service.spec';
import './app/core/services/ui/notification.service.spec';
import './app/core/services/ui/programmatic-navigation-config.service.spec';
import './app/core/services/ui/responsive-navigation.service.spec';
import './app/core/services/ui/sidebar-state.service.spec';
import './app/core/services/ui/temporary-storage.service.spec';
import './app/core/services/ui/toast.service.spec';
import './app/core/services/ui/ui-anomaly-monitor.service.spec';
import './app/core/services/utils/search-util.service.spec';
import './app/core/services/utils/unsaved-work.service.spec';
import './app/core/_utils/crud.service.spec';
import './app/core/_utils/jwt.utils.spec';
import './app/features/admin/categorias/listado-categorias.component.spec';
import './app/features/public/about/containers/about.component.spec';
import './app/features/public/contact/containers/contact.component.spec';
import './app/shared/components/buscador-avanzado/buscador-avanzado.component.spec';
import './app/shared/components/dashboard-chart/dashboard-chart.component.spec';
import './app/shared/components/icons/coreui-icons.spec';
import './app/shared/components/kpi-card/kpi-card.component.spec';
import './app/shared/components/op-pagination/op-pagination.component.spec';
import './app/shared/components/responsive-navigation/responsive-navigation.component.spec';
import './app/shared/components/responsive-navigation/responsive-navigation.visual.spec';
import './app/shared/constants/op-restapi.constants.spec';
import './app/shared/services/common-functionality.service.spec';
import './app/shared/services/navigation-animation.service.spec';
import './app/shared/services/navigation-compatibility.service.spec';
import './app/shared/utils/navigation-migration.service.spec';
import './app/shared/utils/navigation.utils.spec';
import './app/shared/validators/navigation.validators.spec';
