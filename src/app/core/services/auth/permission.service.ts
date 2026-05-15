import { Injectable } from '@angular/core';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private tokenStorage: TokenStorageService) {}

  private getPrivSet(): Set<string> {
    const user = this.tokenStorage.getUser();
    const privs: string[] = Array.isArray(user?.privileges) ? user.privileges : [];
    return new Set(privs);
  }

  has(permission: string): boolean {
    return this.getPrivSet().has(permission);
  }

  hasAny(perms: string[]): boolean {
    const set = this.getPrivSet();
    return perms.some((p) => set.has(p));
  }

  hasAll(perms: string[]): boolean {
    const set = this.getPrivSet();
    return perms.every((p) => set.has(p));
  }
}

