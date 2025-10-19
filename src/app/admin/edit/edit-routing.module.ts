import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {EditComponent} from './edit.component';
import {CanDeactivateGuard} from '../../shared/guards/can-deactivate-guard.service';

const routes: Routes = [
    {
        path: '',
        canDeactivate: [CanDeactivateGuard],
        component: EditComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class EditRoutingModule {
}
