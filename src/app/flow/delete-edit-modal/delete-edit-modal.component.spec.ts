import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DeleteEditModalComponent} from './delete-edit-modal.component';

describe('DeleteEditModalComponent', () => {
    let component: DeleteEditModalComponent;
    let fixture: ComponentFixture<DeleteEditModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DeleteEditModalComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DeleteEditModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
