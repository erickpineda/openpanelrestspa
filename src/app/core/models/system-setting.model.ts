export type SystemSettingType =
  | 'STRING'
  | 'TEXT'
  | 'BOOLEAN'
  | 'INTEGER'
  | 'LONG'
  | 'DECIMAL'
  | 'JSON';

export interface SystemSetting {
  id?: number;
  codigo?: string;
  categoria?: string;
  clave?: string;
  valor?: string;
  descripcion?: string;
  orden?: number;
  tipo?: SystemSettingType | string;
  editable?: boolean;
  visible?: boolean;
  publico?: boolean;
  requiereReinicio?: boolean;
  valorPorDefecto?: string;
}
