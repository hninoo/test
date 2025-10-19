import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {AdminComponent} from './admin.component';
import {CanDeactivateGuard} from 'app/shared/guards/can-deactivate-guard.service';

const routes: Routes = [
    {
        path: '',
        canDeactivate: [CanDeactivateGuard],
        component: AdminComponent,
        children: [
            {
                path: 'page',
                loadChildren: () => import('./page/page.module').then(m => m.PageModule)
            },
            {
                path: 'dataset/table-relations/:table',
                loadChildren: () => import('./view/table-relation/table-relation.module').then(m => m.TableRelationModule)
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {
}
