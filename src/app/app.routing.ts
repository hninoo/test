import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

// Layouts
import {FullLayoutComponent} from './layouts/full-layout.component';
import {SimpleLayoutComponent} from './layouts/simple-layout.component';

// Components
import {LoginComponent} from './components/login.component';
import {TwoFactorComponent} from './two-factor/two-factor.component';
import {IframeFormComponent} from './layouts/iframe-form.component';
import {ResetComponent} from './reset/reset.component';
import {PaymentPageComponent} from './payment-page/payment-page.component';
import {CreateClientComponent} from './manage/create-client.component';
import {UpdateClientComponent} from './manage/update-client.component';
import {FlowComponent} from './flow/flow.component';
import {MaintenanceComponent} from './maintenance/maintenance.component';
import {CertComponent} from './maintenance/cert.component';

export const routes: Routes = [
    {
        path: 'twostepauth',
        component: TwoFactorComponent
    },

    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'public/:table/add/:filter_id/:hash/:public_form',
        component: IframeFormComponent,
    },
    {
        path: 'public/:table/add/:filter_id/:hash/:public_form/:rid',
        component: IframeFormComponent,
    },
    {
        path: 'public/:table/add/:filter_id/:hash',
        component: IframeFormComponent,
    },
    {
        path: '',
        component: SimpleLayoutComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent
            },
            {
                path: ':db/login',
                component: LoginComponent
            },
            {
                path: ':db/login/:type',
                component: LoginComponent
            },
            {
                path: ':db/login/auth/:auth_token',
                component: LoginComponent
            },
            {
                path: ':db/manage-login',
                component: LoginComponent
            },
            {
                path: 'user/forgot-password',
                component: LoginComponent,

            },
            {
                path: 'login/:olddb',
                component: LoginComponent
            },
            {
                path: 'reset',
                component: ResetComponent
            },
            {
                path: 'maintenance',
                component: MaintenanceComponent
            },
            {
                path: 'maintenance-cert',
                component: CertComponent
            },
        ]
    },

    {
        path: '',
        component: FullLayoutComponent,
        data: {
            title: 'Home'
        },
        children: [
            {
                path: ':parent_table/matsusho',
                loadChildren: () => import('./custom/matsusho/app.module').then(m => m.AppModule)
            },
            {
                path: ':parent_table/dashboard',
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: ':parent_table/rpa/edit/:id',
                component: FlowComponent
            },
            {
                path: ':parent_table/info/management',
                loadChildren: () => import('./admin/info.module').then(m => m.InfoModule)
            },
            {
                path: ':parent_table/tmp-database',
                loadChildren: () => import('./admin/tmp-database/tmp-database.module').then(m => m.TmpDatabaseModule)
            },
            {
                path: ':parent_table/drone-map',
                loadChildren: () => import('./admin/drone-map/drone-map.module').then(m => m.DroneMapModule)
            },
            {
                path: ':parent_table/sso-settings',
                loadChildren: () => import('./admin/sso-settings.module').then(m => m.SsoSettingsModule)
            },
            {
                path: ':parent_table/:table',
                loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
            },
            {
                path: ':parent_table/group/:id',
                loadChildren: () => import('./admin/group/group-index.module').then(m => m.GroupIndexModule)
            },
            /*
            {
                path: ':parent_table/mail_delivery_list/edit/:id',
                loadChildren: './admin/edit-mail-delivery-list/edit-mail-delivery-list.module#EditMailDeliveryListModule'
            },
            */
            {
                path: ':parent_table/:table/edit/:id',
                loadChildren: () => import('./admin/edit/edit.module').then(m => m.EditModule)
            },
            {
                path: ':parent_table/:table/edit/:id/:system_table',
                loadChildren: () => import('./admin/edit/edit.module').then(m => m.EditModule)
            },
            {
                path: ':parent_table/:table/view/:id',
                loadChildren: () => import('./admin/view/view.module').then(m => m.ViewModule)
            },
            {
                path: ':parent_table/dataset/table-relations/:table',
                loadChildren: () => import('./admin/view/table-relation/table-relation.module').then(m => m.TableRelationModule)
            },
            {
                path: ':parent_table/:table/search',
                loadChildren: () => import('./admin/search/search.module').then(m => m.SearchModule)
            },
            {
                path: ':parent_table/payment/pay',
                component: PaymentPageComponent
            },
            {
                path: ':parent_table/payment/pay/:update_status',
                component: PaymentPageComponent
            },
            {
                path: ':parent_table/internal/create-client',
                component: CreateClientComponent
            },
            {
                path: ':parent_table/internal/update-client',
                component: UpdateClientComponent
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule {

}
