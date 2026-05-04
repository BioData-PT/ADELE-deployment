import { TestBed } from '@angular/core/testing';

import { RemsService } from './rems.service';

describe('RemsService', () => {
  let service: RemsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RemsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
