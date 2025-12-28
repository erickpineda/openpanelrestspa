import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Comentario } from '../../../../core/models/comentario.model';
import { ComentarioService } from '../../../../core/services/data/comentario.service';
import { TokenStorageService } from '../../../../core/services/auth/token-storage.service';
import { CommonFunctionalityService } from '../../../../shared/services/common-functionality.service';
import { OpenpanelApiResponse } from '../../../../core/models/openpanel-api-response.model';

@Component({
  selector: 'app-crear-comentario',
  templateUrl: './crear-comentario.component.html',
  styleUrls: ['./crear-comentario.component.scss'],
  standalone: false,
})
export class CrearComentarioComponent {
  comentario: Comentario = new Comentario();
  submitted = false;

  constructor(
    private comentarioService: ComentarioService,
    private router: Router,
    private tokenStorageService: TokenStorageService,
    private commonFuncService: CommonFunctionalityService
  ) {}

  onSubmit(comentario: Comentario) {
    this.submitted = true;
    // Assign current user as author
    comentario.idUsuario = this.tokenStorageService.getUser().id;

    this.comentarioService.crear(comentario).subscribe((response: OpenpanelApiResponse<any>) => {
      this.commonFuncService.reloadComponent(false, '/admin/control/comentarios');
    });
  }

  onCancel() {
    this.router.navigate(['/admin/control/comentarios']);
  }
}
