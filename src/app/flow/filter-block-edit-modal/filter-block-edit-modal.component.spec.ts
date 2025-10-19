import {ComponentFixture, TestBed} from '@angular/core/testing';

import {FilterBlockEditModalComponent} from './filter-block-edit-modal.component';

describe('FilterBlockEditModalComponent', () => {
    let component: FilterBlockEditModalComponent;
    let fixture: ComponentFixture<FilterBlockEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FilterBlockEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FilterBlockEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
