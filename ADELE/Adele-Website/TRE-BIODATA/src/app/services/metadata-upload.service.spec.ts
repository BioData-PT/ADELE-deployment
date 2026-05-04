import { TestBed } from '@angular/core/testing';

import { MetadataUploadService } from './metadata-upload.service';

describe('MetadataUploadService', () => {
  let service: MetadataUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetadataUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
