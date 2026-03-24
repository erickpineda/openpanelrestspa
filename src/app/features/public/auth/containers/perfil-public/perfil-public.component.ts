import { Component, OnInit } from '@angular/core';
import { TokenStorageService } from '@app/core/services/auth/token-storage.service';

@Component({
  selector: 'app-perfil-public',
  templateUrl: './perfil-public.component.html',
  styleUrls: ['./perfil-public.component.scss'],
  standalone: false,
})
export class PerfilPublicComponent implements OnInit {
  user: any;

  constructor(private tokenStorage: TokenStorageService) {}

  ngOnInit(): void {
    this.user = this.tokenStorage.getUser();
  }
}
