import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataUploadFragmentComponent } from './data-upload-fragment.component';

describe('DataUploadFragmentComponent', () => {
  let component: DataUploadFragmentComponent;
  let fixture: ComponentFixture<DataUploadFragmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataUploadFragmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataUploadFragmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
