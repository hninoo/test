import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {DroneMapComponent} from './drone-map.component';

const routes: Routes = [
    {
        path: '',
        component: DroneMapComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DroneMapRoutingModule {
}
