import { TestBed } from '@angular/core/testing';
import { SearchStoreService } from './search-store.service';

describe('SearchStoreService', () => {
  let service: SearchStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchStoreService],
    });
    service = TestBed.inject(SearchStoreService);
  });

  it('setTerm actualiza estado', () => {
    service.setTerm('abc');
    expect(service.getSnapshot().term).toBe('abc');
  });

  it('clear resetea estado', () => {
    service.setTerm('x');
    service.clear();
    const snap = service.getSnapshot();
    expect(snap.term).toBe('');
    expect(snap.results.length).toBe(0);
  });
});
