import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CopyOtherTableBlockComponent} from './copy-other-table-block.component';

describe('CopyOtherTableBlockComponent', () => {
    let component: CopyOtherTableBlockComponent;
    let fixture: ComponentFixture<CopyOtherTableBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CopyOtherTableBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyOtherTableBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
