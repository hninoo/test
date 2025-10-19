import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CopyBlockEditModalComponent} from './copy-block-edit-modal.component';

describe('CopyBlockEditModalComponent', () => {
    let component: CopyBlockEditModalComponent;
    let fixture: ComponentFixture<CopyBlockEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CopyBlockEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyBlockEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
