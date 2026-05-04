import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalDocumentsManageComponent } from './legal-documents-manage.component';

describe('LegalDocumentsManageComponent', () => {
  let component: LegalDocumentsManageComponent;
  let fixture: ComponentFixture<LegalDocumentsManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalDocumentsManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegalDocumentsManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
