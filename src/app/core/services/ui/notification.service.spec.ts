import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('show aplica duration por defecto cuando no se especifica', (done) => {
    const service = new NotificationService();

    service.notification$.subscribe((n) => {
      expect(n.type).toBe('info');
      expect(n.message).toBe('m');
      expect(n.duration).toBe(5000);
      done();
    });

    service.show({ type: 'info', message: 'm' });
  });

  it('success/error/warning/info delegan en show con el tipo correcto', (done) => {
    const service = new NotificationService();
    const received: string[] = [];

    service.notification$.subscribe((n) => {
      received.push(n.type);
      if (received.length === 4) {
        expect(received).toEqual(['success', 'error', 'warning', 'info']);
        done();
      }
    });

    service.success('ok');
    service.error('x');
    service.warning('w');
    service.info('i');
  });
});
