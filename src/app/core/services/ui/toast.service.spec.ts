import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('show should add toast and auto-remove after delay', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    const id = service.show({
      body: 'x',
      title: 't',
      delay: 10,
      autohide: true,
    });
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(id);

    jasmine.clock().tick(11);
    expect(list.length).toBe(0);
  });

  it('show should prevent exact duplicates and refresh timer', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    const id1 = service.show({
      body: 'x',
      title: 't',
      delay: 50,
      autohide: true,
    });
    jasmine.clock().tick(40);
    const id2 = service.show({
      body: 'x',
      title: 't',
      delay: 50,
      autohide: true,
    });
    expect(id2).toBe(id1);
    expect(list.length).toBe(1);

    jasmine.clock().tick(20);
    expect(list.length).toBe(1);
    jasmine.clock().tick(31);
    expect(list.length).toBe(0);
  });

  it('pauseTimer and resumeTimer should delay autohide', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    const id = service.show({ body: 'x', delay: 100, autohide: true });
    jasmine.clock().tick(40);
    service.pauseTimer(id);
    jasmine.clock().tick(1000);
    expect(list.length).toBe(1);

    service.resumeTimer(id);
    jasmine.clock().tick(101);
    expect(list.length).toBe(0);
  });

  it('removeOldest should remove by createdAt order', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    service.show({ body: 'a', autohide: false });
    jasmine.clock().tick(1);
    service.show({ body: 'b', autohide: false });
    expect(list.length).toBe(2);
    service.removeOldest(1);
    expect(list.length).toBe(1);
    expect(list[0].body).toBe('b');
  });

  it('setMaxVisible should keep most recent toasts', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    service.setMaxVisible(2);
    service.show({ body: 'a', autohide: false });
    jasmine.clock().tick(1);
    service.show({ body: 'b', autohide: false });
    jasmine.clock().tick(1);
    service.show({ body: 'c', autohide: false });

    expect(list.length).toBe(2);
    expect(list.some((t) => t.body === 'a')).toBeFalse();
  });

  it('clear should remove all toasts', () => {
    const service = new ToastService();
    let list: any[] = [];
    service.toasts$.subscribe((t) => (list = t));

    service.show({ body: 'a', autohide: false });
    service.clear();
    expect(list.length).toBe(0);
  });
});
