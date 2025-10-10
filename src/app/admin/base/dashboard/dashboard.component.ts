import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    private entradaService: EntradaService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarEstadisticas();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async cargarEstadisticas(): Promise<void> {
    const usuarioSub = await this.usuarioService.listarPagina(0, 50).subscribe(response => {
      this.cantidadUsuariosActivos = response.data.totalElements;
    });

    const entradaSub = await this.entradaService.listarPagina(0, 50).subscribe(response => {
      this.totalEntradas = response.data.totalElements;
      const entradas = response.data.elements || [];
      
      entradas.forEach((entrada: any) => {
        const fechaPublicacion = entrada.fechaPublicacion;
        if (fechaPublicacion) {
          // Parsear fecha en formato 'DD-MM-YYYY HH:mm:ss'
          const [fecha, hora] = fechaPublicacion.split(' ');
          const [dia, mes, anio] = fecha.split('-').map(Number);
          // Recuerda: los meses en JS van de 0 (enero) a 11 (diciembre)
          const jsDate = new Date(anio, mes - 1, dia);
          const mesJs = jsDate.getMonth();

          if (entrada.publicada) {
            this.entradasMesPublicadas[mesJs] += 1;
          } else {
            this.entradasMesNoPublicadas[mesJs] += 1;
          }
        } else {
          this.entradasMesNoPublicadas[0] += 1;
        }
      });

      this.actualizarGrafico();
      this.cdr.detectChanges();
    });

    this.subscription.add(usuarioSub);
    this.subscription.add(entradaSub);
  }

  actualizarGrafico(): void {
    this.data = {
      ...this.data,
      datasets: [
        {
          ...this.data.datasets[0],
          data: [...this.entradasMesPublicadas]
        },
        {
          ...this.data.datasets[1],
          data: [...this.entradasMesNoPublicadas]
        }
      ]
    };
  }
}
