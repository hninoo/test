import {ComponentFixture, TestBed} from '@angular/core/testing';

import {UpdateEditModalComponent} from './update-edit-modal.component';

describe('UpdateEditModalComponent', () => {
    let component: UpdateEditModalComponent;
    let fixture: ComponentFixture<UpdateEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [UpdateEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(UpdateEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
