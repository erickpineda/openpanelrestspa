import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedCoreUiModule } from '../../shared-coreui.module';
import { BuscadorAvanzadoComponent } from './buscador-avanzado.component';

describe('BuscadorAvanzadoComponent', () => {
  let component: BuscadorAvanzadoComponent;
  let fixture: ComponentFixture<BuscadorAvanzadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, SharedCoreUiModule, TranslateModule.forRoot()],
      declarations: [BuscadorAvanzadoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BuscadorAvanzadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emite onSearch al invocar buscar', () => {
    component.definiciones = {
      entity: 'Entrada',
      version: '2',
      fields: [{ key: 'fechaPublicacion', type: 'datetime', operations: ['equal'] }],
    };
    component.ngOnChanges({
      definiciones: {
        currentValue: component.definiciones,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    } as any);
    (component as any).root = {
      type: 'group',
      op: 'AND',
      _id: 'root',
      children: [
        {
          type: 'condition',
          field: 'fechaPublicacion',
          op: 'equal',
          value: '2026-04-24T10:15',
          _id: 'c1',
        },
      ],
    };
    spyOn(component.onSearch, 'emit');
    component.buscar();
    expect(component.onSearch.emit).toHaveBeenCalled();
    expect(component.onSearch.emit).toHaveBeenCalledWith({
      node: {
        type: 'group',
        op: 'AND',
        children: [
          {
            type: 'condition',
            field: 'fechaPublicacion',
            op: 'equal',
            value: '2026-04-24T10:15:00',
          },
        ],
      },
    });
  });
});
