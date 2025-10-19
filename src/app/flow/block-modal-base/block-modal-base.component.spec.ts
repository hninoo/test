import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BlockModalBaseComponent} from './block-modal-base.component';

describe('BlockModalBaseComponent', () => {
    let component: BlockModalBaseComponent;
    let fixture: ComponentFixture<BlockModalBaseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BlockModalBaseComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BlockModalBaseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
