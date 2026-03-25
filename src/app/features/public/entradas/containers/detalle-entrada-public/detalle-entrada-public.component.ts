import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicEntradasFacadeService } from '../../services/public-entradas-facade.service';
import { PublicSeoService } from '../../../services/public-seo.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { EntradaService } from '@app/core/services/data/entrada.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { OPConstants } from '@shared/constants/op-global.constants';
import { ToastService } from '@app/core/services/ui/toast.service';
import { TranslationService } from '@app/core/services/translation.service';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { ComentariosPublicComponent } from '../../../comentarios/components/comentarios-public.component';

@Component({
  selector: 'app-detalle-entrada-public',
  templateUrl: './detalle-entrada-public.component.html',
  styleUrls: ['./detalle-entrada-public.component.scss'],
  standalone: true,
  imports: [SharedOPModule, RouterModule, ComentariosPublicComponent],
})
export class DetalleEntradaPublicComponent implements OnInit {
  slug: string | null = null;
  entrada: any = null;
  loading: boolean = true;
  error: boolean = false;
  isVoting = false;
  voteError = '';
  isLoggedIn = false;
  comentariosCounts: { visible: number; total: number | null; pending: number } | null = null;
  devModalVisible = false;
  devModalBodyKey = 'PUBLIC.DEV_MODAL.BODY_GENERIC';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facade: PublicEntradasFacadeService,
    private seoService: PublicSeoService,
    private entradaService: EntradaService,
    private tokenStorage: TokenStorageService,
    private toast: ToastService,
    private i18n: TranslationService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.tokenStorage.isLoggedIn();
    this.slug = this.route.snapshot.paramMap.get('slug');
    if (this.slug) {
      this.facade.obtenerPorSlug(this.slug).subscribe({
        next: (res: any) => {
          const entradaData = res?.data || res; // Fallback in case it's already unwrapped
          if (entradaData && entradaData.publicada) {
            this.entrada = entradaData;
            this.seoService.setEntradaSeo(entradaData);
          } else {
            this.error = true;
          }
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
    } else {
      this.error = true;
      this.loading = false;
    }
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
      Promise.resolve(writeText.call(clipboard, url))
        .then(() => this.toast.showSuccess(this.i18n.translate('PUBLIC.SHARE.COPIED')))
        .catch(() => this.toast.showWarning(this.i18n.translate('PUBLIC.SHARE.COPY_FAILED')));
      return;
    }

    this.toast.showWarning(this.i18n.translate('PUBLIC.SHARE.COPY_FAILED'));
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
