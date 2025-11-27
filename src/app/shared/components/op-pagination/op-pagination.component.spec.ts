import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { OpPaginationComponent } from './op-pagination.component';

describe('OpPaginationComponent', () => {
  let component: OpPaginationComponent;
  let fixture: ComponentFixture<OpPaginationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OpPaginationComponent],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(OpPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
