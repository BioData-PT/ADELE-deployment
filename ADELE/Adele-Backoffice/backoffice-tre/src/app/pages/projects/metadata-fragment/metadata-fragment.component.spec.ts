import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataFragmentComponent } from './metadata-fragment.component';

describe('MetadataFragmentComponent', () => {
  let component: MetadataFragmentComponent;
  let fixture: ComponentFixture<MetadataFragmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataFragmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataFragmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
