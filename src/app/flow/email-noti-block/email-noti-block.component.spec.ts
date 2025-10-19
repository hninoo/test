import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EmailNotiBlockComponent} from './email-noti-block.component';

describe('EmailNotiBlockComponent', () => {
    let component: EmailNotiBlockComponent;
    let fixture: ComponentFixture<EmailNotiBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EmailNotiBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EmailNotiBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
