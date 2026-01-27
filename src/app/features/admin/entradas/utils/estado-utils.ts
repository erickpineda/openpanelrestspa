import { EntradaVM } from '../models/entrada.vm';

export function getEstadoInfo(entrada: EntradaVM): { color: string; icon: string; tooltip: string } {
  const nombre = entrada.estadoEntrada?.nombre?.toUpperCase();
  switch (nombre) {
    case 'PUBLICADA':
      return { color: 'success', icon: 'cilCheckCircle', tooltip: 'Publicada' };
    case 'NO PUBLICADA':
      return { color: 'danger', icon: 'cilXCircle', tooltip: 'No Publicada' };
    case 'GUARDADA':
    case 'BORRADOR':
      return { color: 'secondary', icon: 'cilSave', tooltip: 'Guardada' };
    case 'PENDIENTE REVISION':
      return { color: 'warning', icon: 'cilWarning', tooltip: 'Pendiente Revisión' };
    case 'EN REVISION':
      return { color: 'info', icon: 'cilZoom', tooltip: 'En Revisión' };
    case 'REVISADA':
      return { color: 'primary', icon: 'cilTask', tooltip: 'Revisada' };
    case 'HISTORICA':
      return { color: 'dark', icon: 'cilHistory', tooltip: 'Histórica' };
    case 'PROGRAMADA':
      return { color: 'info', icon: 'cilCalendar', tooltip: 'Programada' };
    default:
      return { color: 'secondary', icon: 'cilFile', tooltip: entrada.estadoEntrada?.nombre || 'Archivada' };
  }
}

export function getPreviewStateColor(entrada?: EntradaVM): string {
  const nombre = entrada?.estadoEntrada?.nombre?.toUpperCase();
  if (!nombre) return 'primary';
  switch (nombre) {
    case 'PUBLICADA':
      return 'success';
    case 'NO PUBLICADA':
      return 'danger';
    case 'GUARDADA':
    case 'BORRADOR':
      return 'secondary';
    case 'PENDIENTE REVISION':
      return 'warning';
    case 'EN REVISION':
      return 'info';
    case 'REVISADA':
      return 'primary';
    case 'HISTORICA':
      return 'dark';
    case 'PROGRAMADA':
      return 'info';
    default:
      return 'secondary';
  }
}
