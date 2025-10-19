import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ConditionExplainComponent} from './condition-explain.component';

describe('ConditionExplainComponent', () => {
    let component: ConditionExplainComponent;
    let fixture: ComponentFixture<ConditionExplainComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConditionExplainComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConditionExplainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
