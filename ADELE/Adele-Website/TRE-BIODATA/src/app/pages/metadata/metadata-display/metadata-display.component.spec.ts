import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataDisplayComponent } from './metadata-display.component';

describe('MetadataDisplayComponent', () => {
  let component: MetadataDisplayComponent;
  let fixture: ComponentFixture<MetadataDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
