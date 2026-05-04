import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementsFragmentComponent } from './agreements-fragment.component';

describe('AgreementsFragmentComponent', () => {
  let component: AgreementsFragmentComponent;
  let fixture: ComponentFixture<AgreementsFragmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgreementsFragmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgreementsFragmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
