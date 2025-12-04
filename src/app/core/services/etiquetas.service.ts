import { Injectable } from '@angular/core';
import { EtiquetaService, AsociacionEtiquetaDTO } from './data/etiqueta.service';

export { AsociacionEtiquetaDTO };

@Injectable({ providedIn: 'root' })
export class EtiquetasService extends EtiquetaService {}
