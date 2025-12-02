import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PreloadingStrategy, Route } from '@angular/router';
import { TokenStorageService } from '../services/auth/token-storage.service';

@Injectable()
export class CustomPreloadingStrategyService implements PreloadingStrategy {
  constructor(private tokenStorage: TokenStorageService) {}

  preload(route: Route, loadMe: () => Observable<any>): Observable<any> {
    const preload = !!route.data && !!route.data['preload'];
    if (!preload) { return of(null); }

    const isProtected = (Array.isArray(route.canLoad) && route.canLoad.length > 0) || (Array.isArray(route.canMatch) && route.canMatch.length > 0);
    const loggedIn = this.tokenStorage.isLoggedIn();
    if (isProtected && !loggedIn) { return of(null); }

    const delay = (route.data && (route.data['delay'] as number)) || 0;
    return timer(delay).pipe(mergeMap(() => loadMe()));
  }
}
