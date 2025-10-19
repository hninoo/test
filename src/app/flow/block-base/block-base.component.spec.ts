import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BlockBaseComponent} from './block-base.component';

describe('BlockBaseComponent', () => {
    let component: BlockBaseComponent;
    let fixture: ComponentFixture<BlockBaseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BlockBaseComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BlockBaseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
