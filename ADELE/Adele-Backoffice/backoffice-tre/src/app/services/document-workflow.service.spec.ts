import { TestBed } from '@angular/core/testing';

import { DocumentWorkflowService } from './document-workflow.service';

describe('DocumentWorkflowService', () => {
  let service: DocumentWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
