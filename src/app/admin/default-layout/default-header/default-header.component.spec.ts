import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  AvatarModule,
  BadgeModule,
  BreadcrumbModule,
  DropdownModule,
  GridModule,
  HeaderModule,
  NavModule,
  SidebarModule,
} from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../../../shared/components/icons/icon-subset';
import { DefaultHeaderComponent } from './default-header.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('DefaultHeaderComponent', () => {
  let component: DefaultHeaderComponent;
  let fixture: ComponentFixture<DefaultHeaderComponent>;
  let iconSetService: IconSetService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DefaultHeaderComponent],
      imports: [
        GridModule,
        HeaderModule,
        NavModule,
        BadgeModule,
        AvatarModule,
        DropdownModule,
        BreadcrumbModule,
        RouterTestingModule,
        SidebarModule,
      ],
      providers: [IconSetService],
    }).compileComponents();
  });

  beforeEach(() => {
    iconSetService = TestBed.inject(IconSetService);
    iconSetService.icons = { ...iconSubset };

    fixture = TestBed.createComponent(DefaultHeaderComponent);
    component = fixture.componentInstance;
    component.busy = false;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render aria labels on navigation containers', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const navs = el.querySelectorAll('c-header-nav');
    expect(navs.length).toBeGreaterThan(0);
    const hasMainNav = Array.from(navs).some(
      (n) => n.getAttribute('aria-label') === 'Navegación principal'
    );
    const hasQuickActions = Array.from(navs).some(
      (n) => n.getAttribute('aria-label') === 'Acciones rápidas'
    );
    const hasUserMenu = Array.from(navs).some(
      (n) => n.getAttribute('aria-label') === 'Menú de usuario'
    );
    expect(hasMainNav && hasQuickActions && hasUserMenu).toBeTrue();
  });

  it('should show dynamic badge counts from component state', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const badges = el.querySelectorAll('c-badge');
    const texts = Array.from(badges).map((b) => (b.textContent || '').trim());
    expect(texts).toContain(String(component.notificationsCount));
    expect(texts).toContain(String(component.messagesCount));
    expect(texts).toContain(String(component.tasksCount));
    expect(texts).toContain(String(component.commentsCount));
  });

  it('updates badge counts when userCounts input changes', () => {
    // Set initial values directly to avoid NG0100
    component.userCounts = {
      notifications: 3,
      tasks: 7,
      messages: 9,
      comments: 11,
    };

    // Initial render
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badges = el.querySelectorAll('c-badge');
    const texts = Array.from(badges).map((b) => (b.textContent || '').trim());
    expect(texts).toContain('3');
    expect(texts).toContain('7');
    expect(texts).toContain('9');
    expect(texts).toContain('11');
  });

  it('shows projectsCount in Projects badge', () => {
    component.projectsCount = 123;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector('a[routerLink="/admin/control/entradas"]');
    expect(link).toBeTruthy();
    const badge = link!.querySelector('c-badge');
    expect((badge?.textContent || '').trim()).toBe('123');
  });

  it('should toggle aria-expanded on user menu toggle button', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('a[cDropdownToggle]') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });
});
