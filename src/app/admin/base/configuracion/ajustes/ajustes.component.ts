import { Component, OnInit } from '@angular/core';
import { AjustesService } from '../../../../core/services/data/ajustes.service';
import { Ajustes } from '../../../../core/models/ajustes.model';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss']
})
export class AjustesComponent implements OnInit {
  loading = false;
  error: string | null = null;
  ajustes: Ajustes[] = [];

  constructor(private ajustesService: AjustesService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = null;
    this.ajustesService.listarAjustesSafe().subscribe({
      next: (list: Ajustes[]) => { this.ajustes = Array.isArray(list) ? list : []; this.loading = false; },
      error: () => { this.error = 'Error cargando ajustes'; this.loading = false; }
    });
  }
}
