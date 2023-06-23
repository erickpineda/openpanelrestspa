import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../shared/components/icons/icon-subset';
import { navItems } from './default-layout/_nav';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  public navItems = navItems;

  ngOnInit(): void {
  }

  constructor(
    private router: Router,
    private titleService: Title,
    private iconSetService: IconSetService
  ) {
    // iconSet singleton
    iconSetService.icons = { ...iconSubset };
  }

  public perfectScrollbarConfig = {
    suppressScrollX: true,
  };


  

}
