import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayQueueFilesComponent } from './display-queue-files.component';

describe('DisplayQueueFilesComponent', () => {
  let component: DisplayQueueFilesComponent;
  let fixture: ComponentFixture<DisplayQueueFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayQueueFilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayQueueFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
