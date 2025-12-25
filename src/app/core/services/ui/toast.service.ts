import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMessage } from '../../models/toast.model';

type TimerRecord = {
  timeoutId?: any;
  startAt?: number; // timestamp cuando arrancó el timer
  remaining?: number; // ms restantes para autohide
};

@Injectable({
  providedIn: 'root',
})
export class ToastService implements OnDestroy {
  private _toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this._toasts$.asObservable();

  // timers para autohide: id -> TimerRecord
  private timers = new Map<string, TimerRecord>();

  // configuración
  private maxVisible = 3;
  private defaultDelay = 5000;
  private preventExactDuplicates = true;

  constructor() {
    try {
      const w = window as any;
      const href = String(w?.location?.href || '');
      const isE2E = w?.__E2E_BYPASS_AUTH__ === true || href.includes('e2e=1');
      if (isE2E && typeof w.__E2E_SHOW_TOAST__ !== 'function') {
        w.__E2E_SHOW_TOAST__ = (toast: Partial<ToastMessage>) => this.show(toast);
        w.__E2E_CLEAR_TOASTS__ = () => this.clear();
      }
    } catch {}
  }

  ngOnDestroy(): void {
    this.clearAllTimers();
    this._toasts$.complete();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private now(): number {
    return Date.now();
  }

  private clearTimerRecord(id: string) {
    const rec = this.timers.get(id);
    if (!rec) return;
    if (rec.timeoutId) {
      clearTimeout(rec.timeoutId);
    }
    this.timers.delete(id);
  }

  private clearAllTimers() {
    for (const rec of this.timers.values()) {
      if (rec.timeoutId) clearTimeout(rec.timeoutId);
    }
    this.timers.clear();
  }

  private setToasts(list: ToastMessage[]) {
    this._toasts$.next(list);
  }

  private pushToast(t: ToastMessage) {
    const current = this._toasts$.getValue();
    let newList = [...current, t];

    if (newList.length > this.maxVisible) {
      newList = newList
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        .slice(newList.length - this.maxVisible);
    }

    this.setToasts(newList);

    // configurar timer de autohide si corresponde
    if (t.autohide) {
      // limpiar por si ya había
      this.clearTimerRecord(t.id);
      const delay = t.delay ?? this.defaultDelay;
      const record: TimerRecord = {
        startAt: this.now(),
        remaining: delay,
      };
      record.timeoutId = setTimeout(() => this.removeById(t.id), delay);
      this.timers.set(t.id, record);
    }
  }

  show(toast: Partial<ToastMessage>): string {
    const id = this.generateId();
    const full: ToastMessage = {
      id,
      title: toast.title,
      body: toast.body ?? '',
      color: toast.color ?? 'primary',
      autohide: toast.autohide ?? true,
      delay: toast.delay ?? this.defaultDelay,
      createdAt: this.now(),
      html: toast.html ?? false,
    };

    if (this.preventExactDuplicates) {
      const exists = this._toasts$
        .getValue()
        .find(
          (t) =>
            t.body === full.body &&
            t.title === full.title &&
            t.color === full.color,
        );
      if (exists) {
        if (exists.autohide) {
          // refrescar timer
          this.resetTimerForToast(exists.id, full.delay);
        }
        return exists.id;
      }
    }

    this.pushToast(full);
    return id;
  }

  showSuccess(body: string, title?: string, opts?: Partial<ToastMessage>) {
    return this.show({ ...opts, title, body, color: 'success' });
  }

  showError(body: string, title?: string, opts?: Partial<ToastMessage>) {
    return this.show({ ...opts, title, body, color: 'danger' });
  }

  showInfo(body: string, title?: string, opts?: Partial<ToastMessage>) {
    return this.show({ ...opts, title, body, color: 'info' });
  }

  showWarning(body: string, title?: string, opts?: Partial<ToastMessage>) {
    return this.show({ ...opts, title, body, color: 'warning' });
  }

  removeById(id: string) {
    const current = this._toasts$.getValue();
    const next = current.filter((t) => t.id !== id);
    this.clearTimerRecord(id);
    this.setToasts(next);
  }

  // reset timer (limpia y establece uno nuevo con 'delay' ms)
  private resetTimerForToast(id: string, delay: number) {
    this.clearTimerRecord(id);
    const record: TimerRecord = {
      startAt: this.now(),
      remaining: delay,
    };
    record.timeoutId = setTimeout(() => this.removeById(id), delay);
    this.timers.set(id, record);
  }

  // --------- NUEVAS FUNCIONES: PAUSAR / REANUDAR ---------

  /**
   * Pausa el timer (si existe) del toast con id.
   * Guarda el tiempo restante en el registro.
   */
  pauseTimer(id: string) {
    const rec = this.timers.get(id);
    if (!rec) return;
    // si no hay timeoutId ya o no hay startAt, nada que pausar
    if (!rec.timeoutId || !rec.startAt) return;

    // calcular tiempo transcurrido
    const elapsed = this.now() - (rec.startAt ?? this.now());
    const remaining = Math.max(
      0,
      (rec.remaining ?? this.defaultDelay) - elapsed,
    );

    // limpiar timeout y actualizar registro
    clearTimeout(rec.timeoutId);
    rec.timeoutId = undefined;
    rec.remaining = remaining;
    rec.startAt = undefined;
    this.timers.set(id, rec);
  }

  /**
   * Reanuda el timer del toast con id, usando el remaining que esté guardado.
   * Si no existe registro o remaining, no hace nada.
   */
  resumeTimer(id: string) {
    const rec = this.timers.get(id);
    if (!rec) return;
    // si ya hay timeout, no hacer nada
    if (rec.timeoutId) return;

    const remaining = rec.remaining ?? this.defaultDelay;
    rec.startAt = this.now();
    rec.timeoutId = setTimeout(() => this.removeById(id), remaining);
    this.timers.set(id, rec);
  }

  // --------- FIN PAUSA / REANUDAR ---------

  removeOldest(count = 1) {
    const current = this._toasts$
      .getValue()
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const toRemove = current.slice(0, count);
    toRemove.forEach((t) => this.removeById(t.id));
  }

  clear() {
    this.clearAllTimers();
    this.setToasts([]);
  }

  setMaxVisible(limit: number) {
    this.maxVisible = Math.max(1, Math.floor(limit));
    const current = this._toasts$.getValue();
    if (current.length > this.maxVisible) {
      const keep = current
        .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
        .slice(current.length - this.maxVisible);
      this.setToasts(keep);
    }
  }

  setDefaultDelay(ms: number) {
    this.defaultDelay = Math.max(0, Math.floor(ms));
  }

  setPreventExactDuplicates(enabled: boolean) {
    this.preventExactDuplicates = !!enabled;
  }
}
