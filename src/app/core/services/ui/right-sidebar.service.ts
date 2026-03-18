import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RightSidebarConfig {
  title?: string;
  width?: string;
  backdrop?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class RightSidebarService {
  private _visible = new BehaviorSubject<boolean>(false);
  private _content = new BehaviorSubject<TemplateRef<any> | null>(null);
  private _config = new BehaviorSubject<RightSidebarConfig>({
    title: 'Panel Lateral',
    width: '300px',
    backdrop: true,
  });

  public readonly visible$ = this._visible.asObservable();
  public readonly content$ = this._content.asObservable();
  public readonly config$ = this._config.asObservable();

  constructor() {}

  toggle() {
    this._visible.next(!this._visible.value);
  }

  open(template?: TemplateRef<any>, config?: RightSidebarConfig) {
    if (template) {
      this._content.next(template);
    }
    if (config) {
      this._config.next({ ...this._config.value, ...config });
    }
    this._visible.next(true);
  }

  close() {
    this._visible.next(false);
  }

  setTemplate(template: TemplateRef<any>) {
    this._content.next(template);
  }
}
