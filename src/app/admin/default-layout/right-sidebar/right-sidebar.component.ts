import { Component, OnDestroy, OnInit } from '@angular/core';
import { RightSidebarService } from '../../../core/services/ui/right-sidebar.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.scss'],
  standalone: false
})
export class RightSidebarComponent implements OnInit, OnDestroy {
  visible = false;
  title = 'Panel Lateral';
  private sub: Subscription = new Subscription();

  constructor(public rightSidebarService: RightSidebarService) {}

  ngOnInit(): void {
    this.sub.add(
      this.rightSidebarService.visible$.subscribe(v => this.visible = v)
    );
    this.sub.add(
      this.rightSidebarService.config$.subscribe(c => {
        if (c.title) this.title = c.title;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onVisibleChange(event: boolean) {
    // Only update if value changed to false (closed by backdrop/esc)
    // If it's true, it means it's opening, which is handled by service
    if (!event && this.visible) {
      this.rightSidebarService.close();
    }
  }
}
