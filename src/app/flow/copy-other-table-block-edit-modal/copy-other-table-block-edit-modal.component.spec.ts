import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CopyOtherTableBlockEditModalComponent} from './copy-other-table-block-edit-modal.component';

describe('CopyOtherTableBlockEditModalComponent', () => {
    let component: CopyOtherTableBlockEditModalComponent;
    let fixture: ComponentFixture<CopyOtherTableBlockEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CopyOtherTableBlockEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyOtherTableBlockEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
