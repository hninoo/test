import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ApicallBlockComponent} from './apicall-block.component';

describe('ApicallBlockComponent', () => {
    let component: ApicallBlockComponent;
    let fixture: ComponentFixture<ApicallBlockComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ApicallBlockComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ApicallBlockComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
