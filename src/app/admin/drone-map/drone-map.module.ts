import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {DroneMapRoutingModule} from './drone-map-routing.module';
import {DroneMapComponent} from './drone-map.component';
import {SharedService} from '../../services/shared';
import {Connect} from '../../services/connect';

@NgModule({
    declarations: [
        DroneMapComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        DroneMapRoutingModule
    ],
    providers: [
        SharedService,
        Connect
    ]
})
export class DroneMapModule {
}
