import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SleepBlockComponent} from './sleep-block.component';

describe('SleepBlockComponent', () => {
    let component: SleepBlockComponent;
    let fixture: ComponentFixture<SleepBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SleepBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SleepBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
