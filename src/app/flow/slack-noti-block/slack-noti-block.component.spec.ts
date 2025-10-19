import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SlackNotiBlockComponent} from './slack-noti-block.component';

describe('SlackNotiBlockComponent', () => {
    let component: SlackNotiBlockComponent;
    let fixture: ComponentFixture<SlackNotiBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SlackNotiBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SlackNotiBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
