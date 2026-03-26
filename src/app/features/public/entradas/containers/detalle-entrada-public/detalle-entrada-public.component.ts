import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicEntradasFacadeService } from '../../services/public-entradas-facade.service';
import { PublicSeoService } from '../../../services/public-seo.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { OPConstants } from '@shared/constants/op-global.constants';
import { ToastService } from '@app/core/services/ui/toast.service';
import { TranslationService } from '@app/core/services/translation.service';
import { AnalyticsService } from '@app/core/services/analytics/analytics.service';
import { PublicBookmarksService } from '../../services/public-bookmarks.service';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { ComentariosPublicComponent } from '../../../comentarios/components/comentarios-public.component';
import { TooltipModule } from '@coreui/angular';
import { Subject, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-detalle-entrada-public',
  templateUrl: './detalle-entrada-public.component.html',
  styleUrls: ['./detalle-entrada-public.component.scss'],
  standalone: true,
  imports: [SharedOPModule, TooltipModule, RouterModule, ComentariosPublicComponent],
})
export class DetalleEntradaPublicComponent implements OnInit {
  slug: string | null = null;
  entrada: any = null;
  loading: boolean = true;
  error: boolean = false;
  isVoting = false;
  voteError = '';
  isLoggedIn = false;
  isBookmarked = false;
  relatedEntradas: any[] = [];
  relatedLoading = false;
  comentariosCounts: { visible: number; total: number | null; pending: number } | null = null;
  devModalVisible = false;
  devModalBodyKey = 'PUBLIC.DEV_MODAL.BODY_GENERIC';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facade: PublicEntradasFacadeService,
    private seoService: PublicSeoService,
    private entradaService: EntradaService,
    private tokenStorage: TokenStorageService,
    private toast: ToastService,
    private i18n: TranslationService,
    private analytics: AnalyticsService,
    private bookmarks: PublicBookmarksService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.tokenStorage.isLoggedIn();

    this.route.paramMap
      .pipe(
        map((p) => p.get('slug')),
        distinctUntilChanged(),
        tap((slug) => {
          this.slug = slug;
          this.loading = true;
          this.error = false;
          this.entrada = null;
          this.isBookmarked = false;
          this.relatedEntradas = [];
          this.relatedLoading = false;
          this.comentariosCounts = null;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }),
        switchMap((slug) => {
          if (!slug) return of(null);
          return this.facade.obtenerPorSlug(slug).pipe(catchError(() => of(null)));
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        const entradaData = res?.data || res;
        if (entradaData && entradaData.publicada) {
          this.entrada = entradaData;
          this.seoService.setEntradaSeo(entradaData);
          this.isBookmarked = this.bookmarks.isBookmarked(entradaData?.idEntrada);
          this.loadRelated(entradaData);
          this.loading = false;
          return;
        }
        this.error = true;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }

  openDevModal(bodyKey: string): void {
    this.devModalBodyKey = bodyKey;
    this.devModalVisible = true;
  }

  compartir(): void {
    if (OPConstants.App.Public.Features.SHARE_ENABLED !== true) {
      this.openDevModal('PUBLIC.DEV_MODAL.BODY_SHARE');
      return;
    }

    const url = window.location.href;
    const title = String(this.entrada?.titulo ?? 'OpenPanel');

    const nav: any = navigator as any;
    const nativeShare: any = nav?.share;

    if (typeof nativeShare === 'function') {
      this.analytics.track('share_click', {
        context: 'public_entrada_detail',
        method: 'native',
        slug: String(this.slug ?? ''),
      });
      Promise.resolve(nativeShare.call(nav, { title, url }))
        .catch(() => {
          this.toast.showWarning(this.i18n.translate('PUBLIC.SHARE.NATIVE_FAILED'));
        })
        .finally(() => {
          return;
        });
      return;
    }

    const clipboard: any = nav?.clipboard;
    const writeText: any = clipboard?.writeText;
    if (typeof writeText === 'function') {
      this.analytics.track('share_click', {
        context: 'public_entrada_detail',
        method: 'clipboard',
        slug: String(this.slug ?? ''),
      });
      Promise.resolve(writeText.call(clipboard, url))
        .then(() => this.toast.showSuccess(this.i18n.translate('PUBLIC.SHARE.COPIED')))
        .catch(() => this.toast.showWarning(this.i18n.translate('PUBLIC.SHARE.COPY_FAILED')));
      return;
    }

    this.analytics.track('share_click', {
      context: 'public_entrada_detail',
      method: 'fallback',
      slug: String(this.slug ?? ''),
    });
    this.toast.showWarning(this.i18n.translate('PUBLIC.SHARE.COPY_FAILED'));
  }

  toggleBookmark(): void {
    if (!this.isLoggedIn) {
      this.toast.showWarning(this.i18n.translate('PUBLIC.BOOKMARK.LOGIN_REQUIRED'));
      this.router.navigate(['/login']);
      return;
    }
    if (!this.entrada?.idEntrada) return;

    const result = this.bookmarks.toggle({
      idEntrada: Number(this.entrada.idEntrada),
      slug: this.entrada?.slug ?? this.slug,
      titulo: this.entrada?.titulo ?? null,
      resumen: this.entrada?.resumen ?? null,
      fechaPublicacion: this.entrada?.fechaPublicacion ?? null,
    });
    this.isBookmarked = result.bookmarked;
    this.analytics.track(result.bookmarked ? 'bookmark_add' : 'bookmark_remove', {
      context: 'public_entrada_detail',
      slug: String(this.slug ?? ''),
      idEntrada: Number(this.entrada.idEntrada),
    });
    this.toast.showSuccess(
      this.i18n.translate(result.bookmarked ? 'PUBLIC.BOOKMARK.SAVED' : 'PUBLIC.BOOKMARK.REMOVED')
    );
  }

  shareTo(channel: 'whatsapp' | 'x' | 'linkedin'): void {
    if (OPConstants.App.Public.Features.SHARE_ENABLED !== true) {
      this.openDevModal('PUBLIC.DEV_MODAL.BODY_SHARE');
      return;
    }
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(String(this.entrada?.titulo ?? 'OpenPanel'));
    let target = '';
    if (channel === 'whatsapp') target = `https://wa.me/?text=${text}%20${url}`;
    if (channel === 'x') target = `https://x.com/intent/tweet?text=${text}&url=${url}`;
    if (channel === 'linkedin') target = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    if (!target) return;
    this.analytics.track('share_click', {
      context: 'public_entrada_detail',
      method: channel,
      slug: String(this.slug ?? ''),
    });
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  private loadRelated(entrada: any): void {
    const idEntrada = Number(entrada?.idEntrada);
    if (!Number.isFinite(idEntrada) || idEntrada <= 0) return;

    const etiqueta = Array.isArray(entrada?.etiquetas)
      ? String(entrada.etiquetas?.[0]?.nombre ?? '').trim()
      : '';
    const categoria = Array.isArray(entrada?.categorias)
      ? String(entrada.categorias?.[0]?.nombre ?? '').trim()
      : '';

    const searchBy = (filterKey: string, value: string) => {
      const v = String(value ?? '').trim();
      if (!v) return;
      const searchRequest: any = {
        dataOption: 'ALL',
        searchCriteriaList: [
          { filterKey: 'publicada', operation: 'EQUAL', value: true, clazzName: 'Entrada' },
          { filterKey: 'idEntrada', operation: 'NOT_EQUAL', value: idEntrada, clazzName: 'Entrada' },
          { filterKey, operation: 'EQUAL', value: v, clazzName: 'Entrada' },
        ],
      };
      this.relatedLoading = true;
      this.entradaService.buscarSafe(searchRequest, 0, 6, 'fechaPublicacion', 'DESC').subscribe({
        next: (res) => {
          const elements = Array.isArray((res as any)?.elements) ? (res as any).elements : [];
          this.relatedEntradas = elements.filter((e: any) => Number(e?.idEntrada) !== idEntrada);
          this.relatedLoading = false;
        },
        error: () => {
          this.relatedEntradas = [];
          this.relatedLoading = false;
        },
      });
    };

    if (etiqueta) {
      searchBy('etiqueta.nombre', etiqueta);
      return;
    }
    if (categoria) {
      searchBy('categoria.nombre', categoria);
    }
  }

  darMeGusta(): void {
    if (OPConstants.App.Public.Features.VOTE_ENABLED !== true) {
      this.openDevModal('PUBLIC.DEV_MODAL.BODY_VOTE');
      return;
    }
    if (this.isVoting) return;
    if (!this.entrada?.idEntrada) return;

    this.voteError = '';
    this.isVoting = true;

    const previousVotes = Number(this.entrada?.votos ?? 0);
    const newVotes = previousVotes + 1;
    this.entrada = { ...this.entrada, votos: newVotes };

    const user = this.tokenStorage.getUser();
    const userId = user?.idUsuario ?? user?.id ?? user?.userId ?? null;

    this.entradaService.votarEntrada(this.entrada.idEntrada, userId || undefined).subscribe({
      next: (ok) => {
        if (ok) {
          this.isVoting = false;
          return;
        }

        this.entradaService
          .actualizarVotosEntrada(this.entrada.idEntrada, newVotes, userId || undefined)
          .subscribe({
            next: (ok2) => {
              if (!ok2) {
                this.entrada = { ...this.entrada, votos: previousVotes };
                this.voteError = 'No se pudo registrar tu voto.';
              }
              this.isVoting = false;
            },
            error: () => {
              this.entrada = { ...this.entrada, votos: previousVotes };
              this.voteError = 'No se pudo registrar tu voto.';
              this.isVoting = false;
            },
          });
      },
      error: () => {
        this.entrada = { ...this.entrada, votos: previousVotes };
        this.voteError = 'No se pudo registrar tu voto.';
        this.isVoting = false;
      },
    });
  }
}
