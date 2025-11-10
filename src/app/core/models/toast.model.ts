export interface ToastMessage {
  id: string;
  title?: string;
  body: string;
  color?: 'primary'|'secondary'|'success'|'danger'|'warning'|'info'|'light'|'dark';
  delay: number;     // ms
  autohide?: boolean;
  createdAt: number; // timestamp para ordenar/expulsar antiguos
  html?: boolean
}
