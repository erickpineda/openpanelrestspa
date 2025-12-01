import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminComponent } from './admin.component';
import { of } from 'rxjs';
import { DashboardApiService } from '../core/services/dashboard-api.service';


describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminComponent ],
      providers: [
        { provide: DashboardApiService, useValue: { getContentStats: () => of({ totalEntradas: 0 }) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    TestBed.overrideTemplate(AdminComponent, '<div></div>');

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
