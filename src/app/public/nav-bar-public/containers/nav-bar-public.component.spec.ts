import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavBarPublicComponent } from './nav-bar-public.component';

describe('NavBarPublicComponent', () => {
  let component: NavBarPublicComponent;
  let fixture: ComponentFixture<NavBarPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavBarPublicComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavBarPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
