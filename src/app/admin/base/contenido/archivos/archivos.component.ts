import { Component, OnInit } from '@angular/core';
import { ArchivosService } from '../../../../core/services/data/archivos.service';
import { MediaItem } from '../../../../core/models/media-item.model';

@Component({
  selector: 'app-archivos',
  templateUrl: './archivos.component.html',
  styleUrls: ['./archivos.component.scss']
})
export class ArchivosComponent implements OnInit {
  loading = false;
  error: string | null = null;
  items: MediaItem[] = [];
  pageNo = 0;
  pageSize = 12;

  constructor(private archivos: ArchivosService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    this.archivos.listarSafe(pageNo, this.pageSize).subscribe({
      next: (list: MediaItem[]) => { this.items = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.error = 'Error cargando archivos'; this.loading = false; }
    });
  }
}
