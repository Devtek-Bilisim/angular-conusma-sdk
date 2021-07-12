import { TestBed } from '@angular/core/testing';

import { AngularConusmaService } from './angular-conusma.service';

describe('AngularConusmaService', () => {
  let service: AngularConusmaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularConusmaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
