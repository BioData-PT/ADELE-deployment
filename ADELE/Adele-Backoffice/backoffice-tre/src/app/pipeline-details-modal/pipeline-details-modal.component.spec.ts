import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineDetailsModalComponent } from './pipeline-details-modal.component';

describe('PipelineDetailsModalComponent', () => {
  let component: PipelineDetailsModalComponent;
  let fixture: ComponentFixture<PipelineDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipelineDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipelineDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
