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
import './app/admin/base/dashboard/dashboard.component.spec';
import './app/admin/default-layout/default-header/default-header.component.spec';
import './app/admin/default-layout/default-footer/default-footer.component.spec';
import './app/admin/admin.component.spec';
import './app/shared/components/kpi-card/kpi-card.component.spec';
import './app/shared/components/op-pagination/op-pagination.component.spec';
import './app/shared/components/buscador-avanzado/buscador-avanzado.component.spec';
import './app/public/about/containers/about.component.spec';
import './app/public/contact/containers/contact.component.spec';
import './app/core/preloading/custom-preloading-strategy.service.spec';
import './app/admin/admin.component.ng0100.spec';
import './app/admin/base/entradas/listado-entradas.component.ng0100.spec';
// import './app/admin/base/comentarios/crear-editar/crear-editar-comentario.component.spec';
import './app/admin/base/categorias/listado-categorias.component.spec';
import './app/core/services/dashboard-api.service.spec';
import './app/shared/services/common-functionality.service.spec';
import './app/core/services/srv-busqueda/busqueda.service.spec';
import './app/core/errors/error-boundary/error-boundary.service.spec';
import './app/core/services/utils/search-util.service.spec';
import './app/core/services/data/comentario.service.spec';
import './app/core/models/privilegio.model.spec';
import './app/admin/base/perfil/containers/perfil.component.spec';
import './app/core/services/data/usuario.service.spec';
import './app/core/services/data/categoria.service.spec';
import './app/core/services/data/etiqueta.service.spec';
import './app/core/services/data/entrada.service.spec';
import './app/core/services/data/entrada-catalog.service.spec';
import './app/admin/base/dashboard/srv/dashboard-facade.service.spec';
import './app/core/services/ui/toast.service.spec';
import './app/core/services/ui/temporary-storage.service.spec';
import './app/core/services/auth/route-tracker.service.spec';
import './app/core/services/auth/session-manager.service.spec';
import './app/core/services/auth/auth.service.spec';
import './app/core/services/auth/token-storage.service.spec';
import './app/core/services/auth/auth-sync.service.spec';
import './app/core/services/auth/post-login-redirect.service.spec';
import './app/core/services/utils/unsaved-work.service.spec';
import './app/shared/constants/op-restapi.constants.spec';
import './app/core/interceptor/network.interceptor.spec';
import './app/core/services/data/rol.service.spec';
import './app/core/_utils/crud.service.spec';
import './app/core/services/logger-buffer.service.spec';
import './app/core/services/ui/notification.service.spec';
import './app/core/services/ui/loading.service.spec';
import './app/core/services/logger.service.spec';
import './app/shared/utils/navigation.utils.spec';
import './app/core/_utils/jwt.utils.spec';
import './app/core/services/ui/ui-anomaly-monitor.service.spec';
