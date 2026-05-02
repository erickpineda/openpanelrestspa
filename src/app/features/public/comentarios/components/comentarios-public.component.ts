import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ComentarioService } from '@app/core/services/data/comentario.service';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';
import { parseAllowedDate } from '@shared/utils/date-utils';
import { PublicCommentsUxService } from '../services/public-comments-ux.service';
import { OPConstants } from '@shared/constants/op-global.constants';
import { RouterModule } from '@angular/router';
import { SharedOPModule } from '@shared/shared.module';
import { UsuarioService } from '@app/core/services/data/usuario.service';
import { HttpContext } from '@angular/common/http';
import { SKIP_GLOBAL_LOADER } from '@app/core/interceptor/network.interceptor';

@Component({
  selector: 'app-comentarios-public',
  templateUrl: './comentarios-public.component.html',
  styleUrls: ['./comentarios-public.component.scss'],
  standalone: true,
  imports: [SharedOPModule, RouterModule],
})
export class ComentariosPublicComponent implements OnInit {
  @Input() idEntrada!: number;
  @Input() totalComentarios: number | null = null;
  @Input() slugEntrada: string | null = null;

  @Output() countsChange = new EventEmitter<{ visible: number; total: number | null; pending: number }>();

  comentarios: any[] = [];
  nuevoComentarioTexto = '';
  isLoggedIn = false;
  isSubmitting = false;
  isLoading = false;
  pageNo = 0;
  pageSize = 10;
  hasMore = false;
  successMessage = '';
  errorMessage = '';

  visibleCount = 0;
  totalCount: number | null = null;
  pendingCount = 0;
  showMyPendingNotice = false;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  private usernameByUserId = new Map<string, string>();
  private requestedUserIds = new Set<string>();

  devModalVisible = false;
  devModalBodyKey = 'PUBLIC.DEV_MODAL.BODY_GENERIC';

  constructor(
    private comentarioService: ComentarioService,
    private tokenStorage: TokenStorageService,
    private usuarioService: UsuarioService,
    public ux: PublicCommentsUxService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.tokenStorage.getToken();
    this.currentUserId = this.getUserId();
    this.currentUsername = this.getUsername();
    this.totalCount = typeof this.totalComentarios === 'number' ? this.totalComentarios : null;
    this.hidratarAvisoPendienteUsuario();
    if (this.ux.useRecuentosEndpoint) {
      this.cargarRecuentosDesdeApi();
    }
    this.cargarComentarios(true);
  }

  private openDevModal(bodyKey: string): void {
    this.devModalBodyKey = bodyKey;
    this.devModalVisible = true;
  }

  private cargarRecuentosDesdeApi() {
    if (OPConstants.App.Public.Comentarios.USE_RECUENTOS_ENDPOINT !== true) {
      this.openDevModal('PUBLIC.DEV_MODAL.BODY_COMMENT_COUNTS');
      return;
    }
    if (!this.idEntrada) return;
    this.comentarioService.obtenerRecuentosPorIdEntradaCached(this.idEntrada).subscribe((rec) => {
      if (!rec) {
        this.openDevModal('PUBLIC.DEV_MODAL.BODY_COMMENT_COUNTS');
        return;
      }
      const visibles = Number(rec.visibles ?? 0);
      const totales = Number(rec.totales ?? 0);
      const pendientes = Number(rec.pendientes ?? Math.max(totales - visibles, 0));
      this.visibleCount = Number.isFinite(visibles) && visibles >= 0 ? visibles : 0;
      this.totalCount = Number.isFinite(totales) && totales >= 0 ? totales : this.totalCount;
      this.pendingCount = Number.isFinite(pendientes) && pendientes >= 0 ? pendientes : 0;
      this.emitirRecuentos();
    });
  }

  private emitirRecuentos() {
    this.countsChange.emit({
      visible: this.visibleCount,
      total: this.totalCount,
      pending: this.pendingCount,
    });
  }

  private recalcularPendientes() {
    if (typeof this.totalCount !== 'number') {
      this.pendingCount = 0;
      return;
    }
    this.pendingCount = Math.max(0, this.totalCount - this.visibleCount);
  }

  private getUserId(): string | null {
    const user = this.tokenStorage.getUser();
    const userId = user?.idUsuario ?? user?.id ?? user?.userId ?? null;
    return userId != null ? String(userId) : null;
  }

  private getUsername(): string | null {
    const user = this.tokenStorage.getUser();
    const username = user?.username ?? user?.nombreUsuario ?? user?.name ?? null;
    return username != null ? String(username) : null;
  }

  private normalizeUsername(raw: any): string | null {
    const candidates = [
      raw?.username,
      raw?.usernameCreador,
      raw?.usuario?.username,
      raw?.usuario?.nombreUsuario,
      raw?.usuario?.name,
      raw?.user?.username,
      raw?.user?.nombreUsuario,
      raw?.user?.name,
      raw?.autor?.username,
      raw?.nombreUsuario,
    ];
    for (const c of candidates) {
      const v = c != null ? String(c).trim() : '';
      if (v.length > 0) return v;
    }
    const idUsuario = raw?.idUsuario ?? raw?.usuario?.idUsuario ?? raw?.user?.idUsuario ?? null;
    if (idUsuario != null && this.currentUserId && String(idUsuario) === this.currentUserId && this.currentUsername) {
      const v = String(this.currentUsername).trim();
      return v.length > 0 ? v : null;
    }
    return null;
  }

  private getComentarioUserId(raw: any): string | null {
    const idUsuario = raw?.idUsuario ?? raw?.usuario?.idUsuario ?? raw?.user?.idUsuario ?? null;
    return idUsuario != null ? String(idUsuario) : null;
  }

  private patchComentariosUsername(userId: string, username: string): void {
    const normalizedUsername = String(username).trim();
    if (!normalizedUsername) return;
    this.comentarios = this.comentarios.map((c: any) => {
      const cUserId = this.getComentarioUserId(c);
      const current = c?.username != null ? String(c.username).trim() : '';
      if (cUserId === userId && current.length === 0) return { ...c, username: normalizedUsername };
      return c;
    });
  }

  private hidratarUsernamesDesdeApi(comments: any[]): void {
    const context = new HttpContext().set(SKIP_GLOBAL_LOADER, true);
    for (const c of comments) {
      const userId = this.getComentarioUserId(c);
      if (!userId) continue;

      const current = c?.username != null ? String(c.username).trim() : '';
      if (current.length > 0) {
        this.usernameByUserId.set(userId, current);
        continue;
      }

      const cached = this.usernameByUserId.get(userId);
      if (cached) {
        this.patchComentariosUsername(userId, cached);
        continue;
      }

      if (this.requestedUserIds.has(userId)) continue;
      const idNum = Number(userId);
      if (!Number.isFinite(idNum)) continue;

      this.requestedUserIds.add(userId);
      this.usuarioService.obtenerPorIdSafe(idNum, context).subscribe({
        next: (u: any) => {
          const username = u?.username ?? u?.nombreUsuario ?? u?.name ?? null;
          const v = username != null ? String(username).trim() : '';
          if (!v) return;
          this.usernameByUserId.set(userId, v);
          this.patchComentariosUsername(userId, v);
        },
        error: () => {},
      });
    }
  }

  private getPendingNoticeStorageKey(): string | null {
    const userId = this.getUserId();
    if (!userId || !this.idEntrada) return null;
    return `public-comments:pending:${this.idEntrada}:${userId}`;
  }

  private hidratarAvisoPendienteUsuario() {
    if (!this.isLoggedIn) return;
    const key = this.getPendingNoticeStorageKey();
    if (!key) return;
    const raw = window.localStorage.getItem(key);
    const ts = raw ? Number(raw) : NaN;
    if (!Number.isFinite(ts)) return;
    const age = Date.now() - ts;
    this.showMyPendingNotice = age >= 0 && age <= this.ux.pendingNoticeTtlMs;
  }

  cargarComentarios(reset: boolean = false) {
    if (!this.idEntrada) return;
    if (reset) {
      this.pageNo = 0;
      this.comentarios = [];
    }

    this.isLoading = true;
    this.comentarioService.listarPorIdEntrada(this.idEntrada, this.pageNo, this.pageSize).subscribe({
      next: (res: any) => {
        const elements = res?.elements || [];
        const normalized = (Array.isArray(elements) ? elements : []).map((c: any) => {
          const username = this.normalizeUsername(c);
          return username ? { ...c, username } : c;
        });
        this.comentarios = [...this.comentarios, ...normalized];
        this.hidratarUsernamesDesdeApi(normalized);

        const totalElements = Number(res?.totalElements);
        if (Number.isFinite(totalElements) && totalElements >= 0) {
          this.visibleCount = totalElements;
        } else {
          this.visibleCount = this.comentarios.length;
        }
        this.recalcularPendientes();
        this.emitirRecuentos();

        const totalPages = Number(res?.totalPages ?? 0);
        const hasMoreByPages = totalPages > 0 ? this.pageNo + 1 < totalPages : false;
        const hasMoreBySize = Array.isArray(elements) ? elements.length === this.pageSize : false;
        this.hasMore = Boolean(res?.hasMore ?? (hasMoreByPages || hasMoreBySize));
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar comentarios:', err);
      },
    });
  }

  cargarMas() {
    if (this.isLoading || !this.hasMore) return;
    this.pageNo += 1;
    this.cargarComentarios(false);
  }

  enviarComentario() {
    if (!this.nuevoComentarioTexto.trim()) return;
    this.isSubmitting = true;

    const user = this.tokenStorage.getUser();
    const userId = user?.idUsuario ?? user?.id ?? user?.userId ?? null;

    const payload: any = {
      contenido: this.nuevoComentarioTexto,
      idEntrada: this.idEntrada,
      entradaSlug: this.slugEntrada,
      idUsuario: userId,
      username: user ? user.username : null,
      email: user ? user.email : null
    };

    if (!this.isLoggedIn) {
      this.errorMessage = 'Debes iniciar sesión para comentar.';
      this.isSubmitting = false;
      setTimeout(() => (this.errorMessage = ''), 5000);
      return;
    }

    this.comentarioService.crear(payload).subscribe({
      next: () => {
        this.successMessage = 'Comentario enviado con éxito. Pendiente de moderación.';
        this.nuevoComentarioTexto = '';
        this.isSubmitting = false;
        const key = this.getPendingNoticeStorageKey();
        if (key) {
          window.localStorage.setItem(key, String(Date.now()));
          this.showMyPendingNotice = true;
        }
        this.cargarComentarios(true);
        setTimeout(() => (this.successMessage = ''), 5000);
      },
      error: (err: any) => {
        this.errorMessage =
          err?.status === 403
            ? 'Tu cuenta no tiene permiso para publicar comentarios.'
            : 'Error al enviar el comentario.';
        this.isSubmitting = false;
        setTimeout(() => (this.errorMessage = ''), 5000);
      },
    });
  }

  getFechaDate(fecha: any): Date | null {
    return parseAllowedDate(fecha);
  }
}
