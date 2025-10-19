import {ComponentFixture, TestBed} from '@angular/core/testing';

import {SleepEditModalComponent} from './sleep-edit-modal.component';

describe('SleepEditModalComponent', () => {
    let component: SleepEditModalComponent;
    let fixture: ComponentFixture<SleepEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SleepEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SleepEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
