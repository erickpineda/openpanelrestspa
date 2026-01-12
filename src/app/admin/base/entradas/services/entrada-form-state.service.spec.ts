import { TestBed } from '@angular/core/testing';
import { EntradaFormStateService } from './entrada-form-state.service';
import { TemporaryStorageService } from '../../../../core/services/ui/temporary-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';

describe('EntradaFormStateService', () => {
  let service: EntradaFormStateService;
  let temporaryStorageSpy: jasmine.SpyObj<TemporaryStorageService>;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('TemporaryStorageService', ['getTemporaryEntriesByType', 'removeTemporaryEntry', 'saveTemporaryEntry']);
    const logSpy = jasmine.createSpyObj('LoggerService', ['info', 'error', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        EntradaFormStateService,
        { provide: TemporaryStorageService, useValue: storageSpy },
        { provide: LoggerService, useValue: logSpy }
      ]
    });

    service = TestBed.inject(EntradaFormStateService);
    temporaryStorageSpy = TestBed.inject(TemporaryStorageService) as jasmine.SpyObj<TemporaryStorageService>;
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(service.currentState.loading).toBeFalse();
    expect(service.currentState.isFullScreen).toBeFalse();
    expect(service.currentState.showRecoveryNotification).toBeFalse();
  });

  it('should toggle full screen', () => {
    service.toggleFullScreen();
    expect(service.currentState.isFullScreen).toBeTrue();
    service.toggleFullScreen();
    expect(service.currentState.isFullScreen).toBeFalse();
  });

  it('should save temporary entry', () => {
    const data = { formData: { titulo: 'Test' }, title: 'Test Title', description: 'Test Desc' };
    temporaryStorageSpy.saveTemporaryEntry.and.returnValue('new-id');

    service.saveTemporaryEntry(data);

    expect(temporaryStorageSpy.saveTemporaryEntry).toHaveBeenCalled();
    expect(service.currentState.currentTemporaryEntryId).toBe('new-id');
  });

  it('should remove current temporary entry', () => {
    // Setup state with ID
    service.updateState({ currentTemporaryEntryId: 'test-id' });
    
    service.removeCurrentTemporaryEntry();

    expect(temporaryStorageSpy.removeTemporaryEntry).toHaveBeenCalledWith('test-id');
    expect(service.currentState.currentTemporaryEntryId).toBeNull();
  });
  
  it('should check for temporary data and show notification if found', () => {
    const mockEntries = [{ id: '1', timestamp: new Date().toISOString(), formData: {}, formType: 'entrada' }];
    temporaryStorageSpy.getTemporaryEntriesByType.and.returnValue(mockEntries);

    service.checkForTemporaryData(false);

    expect(service.currentState.showRecoveryNotification).toBeTrue();
    expect(service.currentState.temporaryData).toEqual(mockEntries[0]);
  });
});
