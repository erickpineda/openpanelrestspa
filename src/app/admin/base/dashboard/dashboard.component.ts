import { Component, OnInit, OnDestroy } from '@angular/core';
import { EntradaService } from '../../../core/services/entrada.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  cantidadUsuariosActivos: number = 0;
  totalEntradas: number = 0;

  entradasMesPublicadas: number[] = Array(12).fill(0);
  entradasMesNoPublicadas: number[] = Array(12).fill(0);

  data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Entradas Publicadas',
        backgroundColor: '#007bff',
        data: this.entradasMesPublicadas
      },
      {
        label: 'Entradas No Publicadas',
        backgroundColor: '#ff0000',
        data: this.entradasMesNoPublicadas
      }
    ]
  };

  private subscription: Subscription = new Subscription();

  constructor(
    private usuarioService: UsuarioService,
    private entradaService: EntradaService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarEstadisticas(): void {
    const usuarioSub = this.usuarioService.listarPagina(0, 50).subscribe(response => {
      this.cantidadUsuariosActivos = response.data.totalElements;
    });

    const entradaSub = this.entradaService.listarPagina(0, 50).subscribe(response => {
      this.totalEntradas = response.data.totalElements;
      const entradas = response.data.elements || [];
      
      entradas.forEach((entrada: any) => {
        const fechaPublicacion = entrada.fechaPublicacion;
        if (fechaPublicacion) {
          const mes = new Date(fechaPublicacion).getMonth();
          if (entrada.publicada) {
            this.entradasMesPublicadas[mes] += 1;
          } else {
            this.entradasMesNoPublicadas[mes] += 1;
          }
        } else {
          this.entradasMesNoPublicadas[0] += 1; // Si no hay fecha, cuenta como no publicada
        }
      });

      this.actualizarGrafico();
    });

    this.subscription.add(usuarioSub);
    this.subscription.add(entradaSub);
  }

  actualizarGrafico(): void {
    this.data.datasets[0].data = [...this.entradasMesPublicadas];
    this.data.datasets[1].data = [...this.entradasMesNoPublicadas];
  }
}
