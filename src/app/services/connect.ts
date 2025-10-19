import {NgModule} from '@angular/core';
import 'rxjs/Rx';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Observable} from 'rxjs/Observable';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {TableInfo} from '../class/TableInfo';
import {Variable} from '../class/Filter/Variable';
import {catchError} from 'rxjs/operators';
import ToastrService from '../toastr-service-wrapper.service';
import { GoogleMapFilter } from 'app/class/Filter/GoogleMapFilter';

@NgModule({
    imports: [
        HttpClientModule
    ],
    declarations: []
})

export class Connect {
    static showUrlErrorAlert = false;
    static toasterService: ToastrService;
    constructor(private _http: HttpClient,toasterService: ToastrService ) {
        Connect.toasterService = toasterService
    }

    get(url, params = null, request_params = null, handleError = true): Observable<any> {
        if (request_params === null) {
            request_params = {}
        }
        if (!url.match(/http/)) {
            url = environment.api_url + url;
        }

        console.log(location.href)
        if (location.href.match(/\/public\//)) {
            url = url.replace('admin', 'iframe');
        }


        request_params['params'] = params;
        request_params['withCredentials'] = true;


        // `responseType` が blob の場合は明示的に指定
        if (params?.responseType === 'blob') {
            request_params['responseType'] = 'blob';
        }

        if (!handleError) {
            return this._http.get(url, request_params)
        }
        return this._http.get(url, request_params).pipe(
            catchError(this.handleErrorObservable)
        )
    }

    getFile(url): Observable<any> {
        return this._http.get(url, {responseType: 'blob'});
    }

    post(url, params, request_params = {}, handleError = true): Observable<any> {
        if (!url.match(/http/)) {
            url = environment.api_url + url;
        }
        request_params['withCredentials'] = true;
        if (location.href.match(/\/public\//)) {
            url = url.replace('admin', 'iframe');
        }
        if (!handleError) {
            return this._http.post(url, params, request_params);
        }
        return this._http.post(url, params, request_params).pipe(catchError(this.handleErrorObservable));
    }

    postUpload(url, formData: FormData) {
        if (!url.match(/http/)) {
            url = environment.api_url + url;
        }
        //const headers = new Headers();
        /** No need to include Content-Type in Angular 4 */
            // headers.append('Content-Type', 'multipart/form-data');
            //headers.append('Accept', 'application/json');
        const request_params = {};
        request_params['withCredentials'] = true;
        return this._http.post(url, formData, request_params)
    }

    postUploadList(url, formData: FormData[] | any) {
        if (!url.match(/http/)) {
            url = environment.api_url + url;
        }
        //const headers = new Headers();
        //headers.append('Accept', 'application/json');
        const request_params = {};
        request_params['withCredentials'] = true;
        return this._http.post(url, formData, request_params)
    }

    getSiteUrl() {
        return environment.api_url.replace('/api', '');
    }

    getApiUrl() {
        return environment.api_url;
    }

    getUserNames(): Observable<any> {
        return this.post('/admin/user-names', {}, {}, true)
    }

    getUserNamesByDivision(divisionId: number): Observable<any> {
        return this.post('/admin/'+divisionId+'/user-names', {}, {}, true)
    }

    getList(table_info: TableInfo, page = 1, per_page = Number.MAX_SAFE_INTEGER, filter: CustomFilter = null, sort: Object = {}, variables: Array<Variable> = [], handleError = true, relation_set = {}, googleMapFilter: GoogleMapFilter = null): Observable<any> {
        let sort_params = [sort]
        let filter_sort = [];
        if (filter && filter.sort_params.length > 0) {
            let match_one  = false;

            filter_sort = filter.sort_params.map(sortParam => {
                if (sortParam.field == sort['field']){
                    match_one = true;
                    sortParam.asc_desc = sort['asc_desc'];
                }
                return sortParam.toArray()
            })

            if (match_one || sort['field'] == ''){
                sort_params = filter_sort;
            }else{
                sort_params = [sort];
            }
        }

        if(filter && filter.summarizeFilter && filter.summarizeFilter.cross_table){
            per_page = 100000;
        }

        return this.post('/admin/list/' + table_info.table, {
            page: page,
            per_page: per_page,
            search: filter ? filter.getSearchParam() : [],
            chart_params: filter ? filter.getSummarizeParam() : [],
            show_fields: filter ? filter.getShowFields(table_info) : [],
            sort_params: sort_params,
            variables: variables.map(v => v.toArray()),
            force_limit: (filter && filter.force_limit) ? filter.force_limit : null,
            google_map_filter: googleMapFilter ? googleMapFilter.toArray() : null,
            relation_set: relation_set
        }, {}, handleError)
    }

    getOne(table_info: TableInfo, id: number, for_lookup_params = null): Observable<any> {
        let filter = new CustomFilter();
        filter.conditions.addCondition('eq', 'id', id.toString())

        let params: any = {
            page: 1,
            per_page: 1,
            search: filter ? filter.getSearchParam() : [],
            chart_params: [],
            show_fields: [],
            sort_params: [],
            table: table_info.table,
            get_one: true,
        }
        if (for_lookup_params) {
            params = {
                ...params,
                hash: for_lookup_params.hash,
                for_lookup: true,
                for_grant_table: for_lookup_params.table,
                for_grant_filter_id: for_lookup_params.filter_id,
                for_grant_rid: for_lookup_params.rid,
            };
        }

        return this.post('/admin/list/' + table_info.table, params)

    }


    public already_logout = false;
    private showAlert = true;
    handleErrorObservable(error: Response | any) {
        try {
            console.error(error.error)
            console.error(error.body)
            console.error(JSON.stringify(error))
        } catch (e) {
        }

        // To show a toast for the validateDataOperation response in grant.php
        if (error.error?.error_type && error.error?.error_type == 'grant_validation' && error.error?.result && error.error.result === 'error' && error.error?.error_message) {
            Connect.toasterService.error(error.error.error_message);
            return;
        }

        if (error && error.error && error.error.text) {
            const errorMessageMatch = error.error.text.match(/\"error_message\":\"(.*?)\"}/);
            if (errorMessageMatch && errorMessageMatch[1] && errorMessageMatch[1].includes("テーブル設定から確認を行なってください")) {
                Connect.toasterService.error(errorMessageMatch[1]);
            }
        }

        if (error && error.error && error.error.error_type == 'login_max_device_error') {
            Connect.toasterService.warning(error.error.error_message);
            setTimeout(() => {
                location.reload()
            }, 1000);
            return;
        }
        if (error && error.error && error.error.error_type == 'login_error') {
            if (this.already_logout) {
                return;
            }
            this.already_logout = true;

            setTimeout(() => {
                this.showAlert = true;
            }, 10000);


            if (this.showAlert) {
                this.showAlert = false;
                alert('タイムアウトのため、ログアウトされました。再度ログインして下さい。');
            }
            location.href = `/${location.search}`;
            return;
        }
        if (error && error.error && error.error.error_type == 'maintenance' && !location.href.match(/maintenance/)) {
            console.log('maintenance')
            window.location.href = '/maintenance';
            return;
        }
        if ((error.status === 401 || (error && error.error && (
            error.error.error_type === 'client_cert_required' ||
            error.error.error_type === 'client_cert_invalid' ||
            error.error.error_type === 'client_cert_expired'
        ))) && !location.href.match(/maintenance-cert/)) {
            console.log('Client certificate error:', error.status === 401 ? '401 SSL Certificate Error' : error.error.error_type);
            window.location.href = '/maintenance-cert';
            return;
        } else if (error && error.error && error.error.error_type == 'secure_access_only') {
            alert('セキュアなドメインからのみアクセスが許可されています。');
            return;
        }
        if (error && error.error && error.error.error_type == 'permission') {
            window.location.href = '/admin/dashboard';
            return;
        }
        if (error === undefined || (error._body === undefined && (error.error === undefined))) {
            if (!Connect.showUrlErrorAlert) {
                alert('エラーが発生しました。リロードしても改善されない場合、お手数ですがサポートまでお問い合わせください。 sales@loftal.jp');
                Connect.showUrlErrorAlert = true;
            }
            return;
        }
        if (error.error.error_a === undefined) {
            let message = error.error;
            if (message === undefined) {
                if (!Connect.showUrlErrorAlert) {
                    alert('エラーが発生しました。リロードしても改善されない場合、お手数ですがサポートまでお問い合わせください。 sales@loftal.jp');
                    Connect.showUrlErrorAlert = true;
                }
                return;
            }
            else if(message.match(/dataset/)){
                if (!Connect.showUrlErrorAlert) {
                    Connect.showUrlErrorAlert = true;
                    window.location.href = '/admin/dashboard';
                }
                return;
            }
        }
        try {
            if (error.error.error_type !== null && error.error.error_type === 'login_error') {
                return;
            }

            let res = null
            if (error.error) {
                res = (error.error);
                alert(res.error_a.join(','));
            } else {
                res = JSON.parse(error._body);
                alert(res.error_a);
            }
        } catch (e) {
            try {
                if (error.error.error_type !== null && error.error.error_type === 'login_error') {
                    //location.href = '/' + location.pathname.split('/')[1] + '/login';
                } else {
                    alert(error.error.error_a);
                }
            } catch (e) {
                alert('65:unknown error');
            }
        }
        return Observable.throw(error.message || error);
    }
}
