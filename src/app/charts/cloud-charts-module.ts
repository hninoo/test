import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CloudChartsComponent} from '../charts/cloud-charts.component';
import {TabsModule} from 'ngx-bootstrap';
import {NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {CDK_DRAG_CONFIG, DragDropModule} from '@angular/cdk/drag-drop';
import {NgSelectModule} from '@ng-select/ng-select';

@NgModule({
    declarations: [CloudChartsComponent], // 共有するコンポーネントを追加
    imports: [
        CommonModule,
        FormsModule,
        TabsModule,
        NgbTooltipModule,
        DragDropModule,
        NgSelectModule


    ],
    exports: [
        CloudChartsComponent,
    ],
    providers: [
        {
            provide: CDK_DRAG_CONFIG,
            useValue: {
                dragStartThreshold: 0,
                pointerDirectionChangeThreshold: 5,
                zIndex: 100000
            }
        }
    ]
})
export class CloudChartsModule {
}
