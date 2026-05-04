import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksValidationComponent } from './tasks-validation.component';

describe('TasksValidationComponent', () => {
  let component: TasksValidationComponent;
  let fixture: ComponentFixture<TasksValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksValidationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TasksValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
