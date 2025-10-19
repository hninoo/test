import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TriggerBlockComponent} from './trigger-block.component';

describe('TriggerBlockComponent', () => {
  let component: TriggerBlockComponent;
  let fixture: ComponentFixture<TriggerBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TriggerBlockComponent]
    })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
