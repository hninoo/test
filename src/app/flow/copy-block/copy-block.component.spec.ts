import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CopyBlockComponent} from './copy-block.component';

describe('CopyBlockComponent', () => {
    let component: CopyBlockComponent;
    let fixture: ComponentFixture<CopyBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CopyBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
