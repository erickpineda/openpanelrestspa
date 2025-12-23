import { LoggerBufferService } from './logger-buffer.service';

describe('LoggerBufferService', () => {
  it('record publica entradas y respeta límite máximo', () => {
    const service = new LoggerBufferService();
    (service as any).max = 2;

    let latest: any[] = [];
    service.getEntries().subscribe((entries) => (latest = entries));

    service.record('info', 'a');
    expect(latest.length).toBe(1);
    expect(latest[0].message).toBe('a');

    service.record('warn', 'b');
    expect(latest.length).toBe(2);
    expect(latest[0].message).toBe('b');

    service.record('error', 'c');
    expect(latest.length).toBe(2);
    expect(latest[0].message).toBe('c');
  });

  it('clear vacía el buffer', () => {
    const service = new LoggerBufferService();

    let latest: any[] = [];
    service.getEntries().subscribe((entries) => (latest = entries));

    service.record('info', 'x');
    expect(latest.length).toBe(1);

    service.clear();
    expect(latest).toEqual([]);
  });
});
