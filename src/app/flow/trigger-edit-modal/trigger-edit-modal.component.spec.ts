import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TriggerEditModalComponent} from './trigger-edit-modal.component';

describe('TriggerEditModalComponent', () => {
  let component: TriggerEditModalComponent;
  let fixture: ComponentFixture<TriggerEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TriggerEditModalComponent]
    })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
