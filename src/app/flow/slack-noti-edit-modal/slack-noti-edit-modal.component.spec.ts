import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SlackNotiEditModalComponent} from './slack-noti-edit-modal.component';

describe('SlackNotiEditModalComponent', () => {
    let component: SlackNotiEditModalComponent;
    let fixture: ComponentFixture<SlackNotiEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SlackNotiEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SlackNotiEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
