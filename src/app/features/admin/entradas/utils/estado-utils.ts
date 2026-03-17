import { EntradaVM } from '../models/entrada.vm';
import { OPConstants } from '@app/shared/constants/op-global.constants';

export function getEstadoInfo(entrada: EntradaVM): { color: string; icon: string; tooltip: string } {
  const nombre = entrada.estadoEntrada?.nombre?.toUpperCase();
  switch (nombre) {
    case OPConstants.App.Common.Estado.PUBLICADA:
      return { color: 'success', icon: 'cilCheckCircle', tooltip: 'Publicada' };
    case OPConstants.App.Common.Estado.NO_PUBLICADA:
      return { color: 'danger', icon: 'cilXCircle', tooltip: 'No Publicada' };
    case OPConstants.App.Common.Estado.GUARDADA:
    case OPConstants.App.Common.Estado.BORRADOR:
      return { color: 'secondary', icon: 'cilSave', tooltip: 'Guardada' };
    case OPConstants.App.Common.Estado.PENDIENTE_REVISION:
      return { color: 'warning', icon: 'cilWarning', tooltip: 'Pendiente Revisión' };
    case OPConstants.App.Common.Estado.EN_REVISION:
      return { color: 'info', icon: 'cilZoom', tooltip: 'En Revisión' };
    case OPConstants.App.Common.Estado.REVISADA:
      return { color: 'primary', icon: 'cilTask', tooltip: 'Revisada' };
    case OPConstants.App.Common.Estado.HISTORICA:
      return { color: 'dark', icon: 'cilHistory', tooltip: 'Histórica' };
    case OPConstants.App.Common.Estado.PROGRAMADA:
      return { color: 'info', icon: 'cilCalendar', tooltip: 'Programada' };
    default:
      return { color: 'secondary', icon: 'cilFile', tooltip: entrada.estadoEntrada?.nombre || 'Archivada' };
  }
}

export function getPreviewStateColor(entrada?: EntradaVM): string {
  const nombre = entrada?.estadoEntrada?.nombre?.toUpperCase();
  if (!nombre) return 'primary';
  switch (nombre) {
    case OPConstants.App.Common.Estado.PUBLICADA:
      return 'success';
    case OPConstants.App.Common.Estado.NO_PUBLICADA:
      return 'danger';
    case OPConstants.App.Common.Estado.GUARDADA:
    case OPConstants.App.Common.Estado.BORRADOR:
      return 'secondary';
    case OPConstants.App.Common.Estado.PENDIENTE_REVISION:
      return 'warning';
    case OPConstants.App.Common.Estado.EN_REVISION:
      return 'info';
    case OPConstants.App.Common.Estado.REVISADA:
      return 'primary';
    case OPConstants.App.Common.Estado.HISTORICA:
      return 'dark';
    case OPConstants.App.Common.Estado.PROGRAMADA:
      return 'info';
    default:
      return 'secondary';
  }
}
