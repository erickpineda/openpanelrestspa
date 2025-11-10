import { Injectable } from "@angular/core";
import { LoadingService } from "./loading.service";

@Injectable({
  providedIn: 'root'
})
export class BatchLoadingService {
  private batchId = 0;
  private activeBatches = new Set<number>();

  constructor(private loadingService: LoadingService) {}

  startBatch(): number {
    const batchId = ++this.batchId;
    this.activeBatches.add(batchId);
    this.loadingService.setLoading(true, `batch-${batchId}`);
    return batchId;
  }

  endBatch(batchId: number): void {
    this.activeBatches.delete(batchId);
    this.loadingService.setLoading(false, `batch-${batchId}`);
    
    // Si no hay más batches activos, asegurarse de que el loading se oculta
    if (this.activeBatches.size === 0) {
      // Pequeña verificación adicional
      setTimeout(() => {
        if (this.activeBatches.size === 0) {
          // Forzar ocultar cualquier loader residual
          this.loadingService.setLoading(false, 'force-cleanup');
        }
      }, 100);
    }
  }
}