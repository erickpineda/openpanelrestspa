import { Component, OnInit } from '@angular/core';
import { TemasService } from '../../../../core/services/data/temas.service';
import { Tema } from '../../../../core/models/tema.model';

@Component({
  selector: 'app-temas',
  templateUrl: './temas.component.html',
  styleUrls: ['./temas.component.scss']
})
export class TemasComponent implements OnInit {
  loading = false;
  error: string | null = null;
  temas: Tema[] = [];

  constructor(private temasService: TemasService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = null;
    this.temasService.listarTemasSafe().subscribe({
      next: (list: Tema[]) => { this.temas = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.error = 'Error cargando temas'; this.loading = false; }
    });
  }
}
