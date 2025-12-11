// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

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
