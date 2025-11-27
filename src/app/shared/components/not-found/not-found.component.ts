import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
  constructor(private router: Router, private location: Location) { }

  ngOnInit() { }

  goHome() {
    this.router.navigate(['/']);
  }

  contactSupport() {
    this.router.navigate(['/contact']);
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.goHome();
    }
  }
}