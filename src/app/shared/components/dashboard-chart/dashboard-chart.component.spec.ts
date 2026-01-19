import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardChartComponent } from './dashboard-chart.component';
import { ChartjsModule } from '@coreui/angular-chartjs';
import { By } from '@angular/platform-browser';

describe('DashboardChartComponent', () => {
  let component: DashboardChartComponent;
  let fixture: ComponentFixture<DashboardChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartjsModule],
      declarations: [DashboardChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardChartComponent);
    component = fixture.componentInstance;
    component.type = 'doughnut';
    component.options = { responsive: true, maintainAspectRatio: false };
    component.data = {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: 'Test', data: [1, 2, 3], backgroundColor: ['#111', '#222', '#333'] }],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a canvas element when data is provided', () => {
    const canvas = fixture.debugElement.query(By.css('canvas'));
    expect(canvas).toBeTruthy();
  });
})
