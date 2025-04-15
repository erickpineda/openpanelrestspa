import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpPaginationComponent } from './op-pagination.component';

describe('OpPaginationComponent', () => {
  let component: OpPaginationComponent;
  let fixture: ComponentFixture<OpPaginationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OpPaginationComponent]
    });
    fixture = TestBed.createComponent(OpPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
