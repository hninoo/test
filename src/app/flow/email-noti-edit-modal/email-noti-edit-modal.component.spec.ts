import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EmailNotiEditModalComponent} from './email-noti-edit-modal.component';

describe('EmailNotiEditModalComponent', () => {
  let component: EmailNotiEditModalComponent;
  let fixture: ComponentFixture<EmailNotiEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmailNotiEditModalComponent]
    })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailNotiEditModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
