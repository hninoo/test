import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ApicallEditModalComponent} from './apicall-edit-modal.component';

describe('ApicallEditModalComponent', () => {
    let component: ApicallEditModalComponent;
    let fixture: ComponentFixture<ApicallEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApicallEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApicallEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
