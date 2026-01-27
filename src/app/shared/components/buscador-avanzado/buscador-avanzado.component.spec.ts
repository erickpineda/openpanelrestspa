import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SharedCoreuiModule } from '../../shared-coreui.module';
import { BuscadorAvanzadoComponent } from './buscador-avanzado.component';

describe('BuscadorAvanzadoComponent', () => {
  let component: BuscadorAvanzadoComponent;
  let fixture: ComponentFixture<BuscadorAvanzadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, SharedCoreuiModule],
      declarations: [BuscadorAvanzadoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscadorAvanzadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emite onSearch al invocar buscar', () => {
    spyOn(component.onSearch, 'emit');
    component.buscar();
    expect(component.onSearch.emit).toHaveBeenCalled();
  });
});
