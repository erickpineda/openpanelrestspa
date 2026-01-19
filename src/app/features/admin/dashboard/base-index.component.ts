import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-index',
  templateUrl: './base-index.component.html',
  standalone: false,
  host: { 'data-component': 'dashboard-index' },
})
export class BaseIndexComponent {}
