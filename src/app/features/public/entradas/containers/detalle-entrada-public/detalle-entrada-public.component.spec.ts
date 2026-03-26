import { DetalleEntradaPublicComponent } from './detalle-entrada-public.component';

describe('DetalleEntradaPublicComponent', () => {
  const makeComponent = () => {
    const route: any = { snapshot: { paramMap: { get: () => null } } };
    const router: any = {};
    const facade: any = {};
    const seoService: any = {};
    const entradaService: any = {};
    const tokenStorage: any = { isLoggedIn: () => false, getUser: () => null };
    const toast: any = { showSuccess: () => undefined, showWarning: () => undefined };
    const i18n: any = { translate: (k: string) => k };
    const analytics: any = { track: () => undefined };
    const bookmarks: any = { isBookmarked: () => false, toggle: () => ({ bookmarked: false }) };

    return new DetalleEntradaPublicComponent(
      route,
      router,
      facade,
      seoService,
      entradaService,
      tokenStorage,
      toast,
      i18n,
      analytics,
      bookmarks
    );
  };

  it('copia el enlace si no existe share nativo', async () => {
    const component = makeComponent();
    component.entrada = { titulo: 'T' };

    const originalShare = (navigator as any).share;
    const originalClipboard = (navigator as any).clipboard;

    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });

    await component.compartir();

    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
  });
});
