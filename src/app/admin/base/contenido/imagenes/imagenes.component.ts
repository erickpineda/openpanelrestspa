import { Component, OnInit } from '@angular/core';
import { ImagenesService } from '../../../../core/services/data/imagenes.service';
import { MediaItem } from '../../../../core/models/media-item.model';

@Component({
  selector: 'app-imagenes',
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.scss']
})
export class ImagenesComponent implements OnInit {
  loading = false;
  error: string | null = null;
  items: MediaItem[] = [];
  pageNo = 0;
  pageSize = 12;

  constructor(private imagenes: ImagenesService) {}

  ngOnInit(): void { this.load(); }

  load(pageNo = this.pageNo): void {
    this.loading = true; this.error = null;
    this.imagenes.listarSafe(pageNo, this.pageSize).subscribe({
      next: (list: MediaItem[]) => { this.items = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.error = 'Error cargando imágenes'; this.loading = false; }
    });
  }
}
