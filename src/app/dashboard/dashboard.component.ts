import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {Board} from 'app/class/Board';

import {Connect} from '../services/connect';
import {SharedService} from '../services/shared';
import {User} from '../services/user';
import * as cloneDeep from 'lodash/cloneDeep';
import {CustomFilter} from '../class/Filter/CustomFilter';
import {Observable} from 'rxjs/Observable';
import ToastrService from '../toastr-service-wrapper.service';
import {Dashboard} from '../class/Dashboard';
import {DashboardContent} from '../class/DashboardContent';
import {CdkDragDrop, CdkDragMove, moveItemInArray,transferArrayItem} from '@angular/cdk/drag-drop';
import {GroupService} from 'app/services/utils/group-service';
import {SortingService} from 'app/services/utils/sorting-service';

import { Data } from '../class/Data';
import { TableInfo } from '../class/TableInfo';

@Component({
    templateUrl: 'dashboard.component.html',
    styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
    public html: string;
    public loading = true;
    // public totals: Array<any> = [];
    public storage: Array<any> = []; // file and folder

    public selected_template: Object = null;
    public template_a: Array<any> = []; // file and folder
    public template_install_percent: number = 0;
    public template_install_status = 'wait'; //wait , installing , complete
    public size: string;
    public db_name: string;

    public is_explain_collapsed: boolean = true;

    private toasterService: ToastrService;
    public tutorial_flag;

    // for cloud =====

    public editting_id: number = null;
    public cloud_charts: Array<CustomFilter> = [];
    public cloud_chart_order = [];
    public reordering: boolean = false;

    public sending: boolean = false;

    public dashboard_a: Array<Dashboard> = []
    public modalCustomFilter: CustomFilter = null;


    public selectedDashboardId: number = null;
    public editDashboardId: number = null;
    public currentDragDashboardContentId: number;

    // chartモーダル
    @ViewChild('chartModal') chartModal: any;
    @ViewChild('deleteModal') deleteModal: any;
    @ViewChild('loadingModal') loadingModal: any;
    @ViewChild('tutorialModal') tutorialModal: any;
    @ViewChild('dashboardNameModal') dashboardNameModal: any;
    @ViewChild('confirmDeleteDashboardModal') confirmDeleteDashboardModal: any;
    @ViewChild('confirmDeleteDashboardConetntModal') confirmDeleteDashboardConetntModal: any;
    @ViewChild('viewModal') viewModal: any;

    public selectedData: Data = null;
    public table_info: TableInfo;

    public customFilter: CustomFilter;
    public activeDashboardTab  = null;
    public changeDragDrop: boolean = true;

    private delete_filter: CustomFilter;

    private board = new Board({});
    private oldBoard = new Board({});
    private editMode = false;

    public group_dashboard_contents: Array<any>;
    public placeholder_visible = false;

    constructor(private _router: Router, private _route: ActivatedRoute, private _connect: Connect, public _share: SharedService, toasterService: ToastrService, private _user: User,public groupService: GroupService,public sortingService: SortingService) {
        this.toasterService = toasterService;
    }

    ngAfterViewInit() {
    }


    installTemplate(template: Object) {
        this.template_install_status = 'installing';
        this.template_install_percent = 10;
        this._connect.post('/admin/install_template', {id: template['id']}).subscribe((result) => {
                let timer = setInterval(() => {
                    this.template_install_percent += 2;
                    if (this.template_install_percent >= 100) {
                        this.template_install_percent = 100;
                        this.template_install_status = 'complete';
                        clearInterval(timer);

                        this._share.loadAdminDatas();
                    }
                }, 30);
            }, (error) => {
                this.template_install_percent = 0;
                this.template_install_status = 'wait';

                this.tutorialModal.hide();
            }
        );

    }

    goLink(target_link: string): void {
        let commands = [this._share.getAdminTable()];
        target_link.split('/').forEach(function (path) {
            commands.push(path);
        })
        this._router.navigate(commands);
    }


    ngOnInit(): void {
        if (this._share.isTrial() && this._share.getTrialRestDays() < 0) {
            alert('トライアル期間が終了しました。継続ご希望の場合はお問い合わせ下さい。');
            this._user.logout();
            this._router.navigate([this._share.getAdminTable(), 'login']);
            return;
        }

        this._route.queryParams.subscribe(params => {
            if (params['freee_auth'] == "true") {
                this.toasterService.success('freee連携が完了しました', '成功')
            }
            if (params['freee_auth'] == "false") {
                this.toasterService.error('freee連携が失敗しました', 'エラー')
            }
          });

        this._share.loadAdminDatas().then(_share => {
            if (_share.dashboard_disabled) {
                // menu_aがundefinedまたは空の場合のチェックを追加
                if (!_share.menu_a || _share.menu_a.length === 0) {
                    console.error('menu_aが定義されていないため、ダッシュボードを表示します');
                    return;
                }
                this._router.navigate([this._share.getAdminTable(), _share.menu_a[0]['table']]);
                return;
            }

            // this._share.setHeaderDatasetName('', null);
            this._share.header_dataset_name = '';
            this._share.header_dataset_count = 0;
            this._share.header_dataset_img = '';

            this._share.breadcrumbs = [{'link': '/admin/dashboard', 'name': 'ダッシュボード'}];

            this.load();

            //チャート追加の場合
            this._route.params.subscribe(params => {

                let show_template: boolean = params['type'] != undefined && params['type'] === 'add_template';
                show_template ||= this._share.getDatasetNum() == 0;
                show_template &&= this._share.dataset_add_grant
                if (show_template) {
                    this._connect.get('/admin/templates').subscribe((result) => {
                        this.template_a = result.templates;
                        this.is_explain_collapsed = false;
                        this.tutorialModal.show();
                    });
                }
            });
        })

    }


    load() {
        // test
        // this.chart_params['table'] = 'logs';
        this.loading = true;

        this._connect.get('/admin/dashboard').subscribe((data) => {
            this.html = data['html'];
            this.dashboard_a = []
            this.group_dashboard_contents=[];
            data['dashboards'].forEach(dashboard_hash => {
                let dashboard = new Dashboard();
                dashboard.setByHash(dashboard_hash)
                this.dashboard_a.push(dashboard)
            })
            this.activeDashboardTab = this.dashboard_a[0];
            if (this.selectedDashboardId == null && this.dashboard_a.length != 0) {
                this.selectedDashboardId = this.dashboard_a[0].id;
                this.dashboard_a[0].dashboard_content_a.forEach((data, i) => {
                    const contents = {
                        content:data,
                        id:data.id,
                        updated:0,
                        col_size:data.col_size != undefined ? data.col_size : '12',// default column size
                        x:data.x != undefined ? data.x : '1',
                        y:data.y != undefined ? data.y :  i + 1,
                    };
                    this.group_dashboard_contents.push(contents);
                })
            }
            else{
                var keepGoing = true;
                this.dashboard_a.forEach(data => {
                    if(keepGoing){
                        if(data.id==this.selectedDashboardId){
                            data.dashboard_content_a.forEach((data, i) => {
                                const contents = {
                                    content:data,
                                    id:data.id,
                                    updated:0,
                                    col_size:data.col_size != undefined ? data.col_size : '12',// default column size
                                    x:data.x != undefined ? data.x : '1',
                                    y:data.y != undefined ? data.y :  i + 1,
                                };
                                this.group_dashboard_contents.push(contents);
                            })
                            keepGoing=false;
                        }
                    }
                });
            }
            if (keepGoing && this.selectedDashboardId != null && this.dashboard_a.length != 0) {
                this.selectedDashboardId = this.dashboard_a[0].id;
                this.dashboard_a[0].dashboard_content_a.forEach((data, i) => {
                    const contents = {
                        content:data,
                        id:data.id,
                        updated:0,
                        col_size:data.col_size != undefined ? data.col_size : '12',// default column size
                        x:data.x != undefined ? data.x : '1',
                        y:data.y != undefined ? data.y :  i + 1,
                    };
                    this.group_dashboard_contents.push(contents);
                })
            }

            let group_fields = [];
            this.group_dashboard_contents.forEach(contents => {
                if (group_fields.length === 0) {
                    group_fields.push([contents]);
                } else {
                    this.groupService.groupByAxis(group_fields, contents)

                }
            });
            if (group_fields.length > 1) {
                this.sortingService.selectionSort(group_fields, 0, 'y');

            }

            this.fixYorderForNewField(group_fields)

            let total_items = this.group_dashboard_contents.length
            this.group_dashboard_contents = group_fields;

            if (this.group_dashboard_contents.length > 1 ) {
                for (let i = 0; i < (this.group_dashboard_contents.length * 2) / 2; i += 2) {
                    this.group_dashboard_contents.splice(i, 0, [])

                    this.group_dashboard_contents[i + 1].map(column => {
                        column.y = i + 2;
                    })
                }
                this.group_dashboard_contents.splice(this.group_dashboard_contents.length, 0, [])
            }
            this.db_name = this._share.db_name;
            //console.log(this.group_dashboard_contents)
            //console.log(this.test_group_dashboard_contents)
            this.loading = false;

        });

    }

    fixYorderForNewField(fields) {
        fields.map((row, y_index) => {
            row.map((column, x_index) => {
                if (column.y != y_index + 1) {
                    column.y = y_index + 1
                }
                if (column.x != x_index + 1) {
                    column.x = x_index + 1
                }
            })
        })
    }
    showEditModal(content: DashboardContent) {

        this.selectedDashboardContent = content
        this.customFilter = content.customFilter;
        this.editting_id = this.customFilter.id;
        this.chartModal.show();
    }

    closeFunc(event,onSave = false) {
        this.chartModal.hide()
        this.customFilter = null;
        if (onSave) {
            if(event.customFilter.error_a.length!=0){
                this.toasterService.error(event.customFilter.error_a);
            }
            else {
                this.toasterService.success('チャートを保存しました。', '成功');
                this.load();
            }
        }
    }

    deleteChart() {
        this._connect.post('/admin/delete-chart', {'id': this.delete_filter.id}).subscribe((result) => {
            this.sending = false;
            this.deleteModal.hide()
            this.toasterService.success('削除に成功しました');
            this._share.resetTableInfoCache(this.delete_filter.table)
            this.load();
        });
    }

    error(message) {
        this.toasterService.error(message, 'エラー');
        return;
    }

    deleteChartModal(delete_filter: CustomFilter) {
        this.delete_filter = delete_filter
        this.deleteModal.show();

    }

    getThis() {
        return this;
    }

    update(): void {
        this._connect.post('/admin/update-dashboard-content', {
            'dashboardContents': this.group_dashboard_contents
        }).subscribe((data) => {
            this.board = new Board(data['result']);
            this.oldBoard = new Board(data['result']);
            this.toasterService.success('掲示板を保存しました。');
            this.editMode = false;
        });
    }

    tutorialModalHide() {
        this.tutorialModal.hide();
        this._router.navigate([this._share.getAdminTable(), 'dashboard']);
    }

    tutorialModalClose() {
        this.tutorialModal.hide();
        this.selected_template = null;
        this.template_install_status = 'wait';
        this._router.navigate([this._share.getAdminTable(), 'dashboard']);
    }

    public _dashboardContent = '';
    public editingDashBoardContentId = null;

    enableEditMode(content: DashboardContent) {
        this._dashboardContent = content.content;
        this.editingDashBoardContentId = content.id;
        this.editMode = true;
    }
    cancelEditMode(content: DashboardContent){
        this.editMode = !this.editMode;
        content.content = this._dashboardContent;
        this._dashboardContent = '';
        this.editingDashBoardContentId = null;
    }

    disableEditMode() {
        this.board = cloneDeep(this.oldBoard);
        this.editMode = false;
    }

    getFroalaOption() {

        let option = this._share.getFroalaOption();
        option.heightMin = 200;
        return option;
    }

    getMenuName(table_name: string): Observable<string> {
        return new Observable((observer) => {
            return this._share.getTableInfo(table_name).subscribe(table_info => {
                observer.next(table_info.menu.name)
            })
            return {
                unsubscribe() {
                }
            };
        });
    }

    onTabChange(dashboard) {
        if(this.activeDashboardTab.id == dashboard.id) return;
        this.activeDashboardTab = dashboard;
        this.group_dashboard_contents=[];
        dashboard.dashboard_content_a.forEach((data, i) => {
            const contents = {
                content:data,
                id:data.id,
                updated:0,
                col_size:data.col_size != undefined ? data.col_size : '12',// default column size
                x:data.x != undefined ? data.x : '1',
                y:data.y != undefined ? data.y :  i + 1,
            };
            this.group_dashboard_contents.push(contents);
        })
        let group_fields = [];
        this.group_dashboard_contents.forEach(contents => {
            if (group_fields.length === 0) {
                group_fields.push([contents]);
            } else {
                this.groupService.groupByAxis(group_fields, contents)
            }
        });
        if (group_fields.length > 1) {
            this.sortingService.selectionSort(group_fields, 0, 'y');
        }
        this.fixYorderForNewField(group_fields)
        let total_items = this.group_dashboard_contents.length
        this.group_dashboard_contents = group_fields;

        if (this.group_dashboard_contents.length > 1 ) {
            for (let i = 0; i < (this.group_dashboard_contents.length * 2) / 2; i += 2) {
                this.group_dashboard_contents.splice(i, 0, [])
                this.group_dashboard_contents[i + 1].map(column => {
                    column.y = i + 2;
                })
            }
            this.group_dashboard_contents.splice(this.group_dashboard_contents.length, 0, [])
        }
    }


    addChart(dashboard: Dashboard) {
        this.selectedDashboardContent = null;
        this.customFilter = new CustomFilter({'table': 'admin'});
        this.customFilter.setAsTable();
        this.chartModal.show()
    }

    addDashBoardContent(dashboard: Dashboard) {
        this._connect.post('/admin/dashboard/add-content', {'dashboard_id': this.selectedDashboardId}).subscribe(
            (jsonData) => {
                this.sending = false;
                if (jsonData['result'] === 'success') {
                    this.toasterService.success('掲示板を追加しました。', '成功');
                    this.load()
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            }, (error) => {
            }
        );
    }


    dragMoved(e: CdkDragMove, content_id) {
        if (content_id != this.currentDragDashboardContentId) {
            this.currentDragDashboardContentId = content_id
        }
    }


    changeDashboardName(dashboard: Dashboard = null) {
        if (dashboard) {
            this.editDashboardId = dashboard.id
        } else {
            this.editDashboardId = null;
        }
        this.dashboardNameModal.show()

    }
    hideDashboardModal(){
        this._share.breadcrumbs = [{ 'link': '/admin/dashboard', 'name': 'ダッシュボード' }];
        this.dashboardNameModal.hide();
    }
    onSaveDashboardName($event) {
        this.dashboardNameModal.hide();
        this.selectedDashboardId=$event.id.toString();
        this._share.breadcrumbs = [{ 'link': '/admin/dashboard', 'name': 'ダッシュボード' }];
        this.load()
        console.log($event)

    }

    public selectedDashboardContent: DashboardContent = null;

    deleteDashboardContentConfirm(content: DashboardContent) {
        console.log(content)
        this.selectedDashboardContent = content

        this.confirmDeleteDashboardConetntModal.show()


    }

    deleteDashboardContent() {

        this._connect.post('/admin/dashboard/delete-content', {'dashboard_content_id': this.selectedDashboardContent.id}).subscribe(
            (jsonData) => {
                this.sending = false;
                this.confirmDeleteDashboardConetntModal.hide();
                if (jsonData['result'] === 'success') {
                    this.toasterService.success('削除しました。', '成功');
                    this.load()
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            }, (error) => {
            }
        );
    }

    deleteDashboard() {
        console.log(this.selectedDashboardId)
        this._connect.post('/admin/delete/dashboards', {'id_a': [this.selectedDashboardId]}).subscribe(
            (jsonData) => {
                this.sending = false;
                this.confirmDeleteDashboardModal.hide();
                if (jsonData['result'] === 'success') {
                    this.toasterService.success('ダッシュボードを削除しました。', '成功');
                    this.load()
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            }, (error) => {
            }
        );
    }

    drop(event: CdkDragDrop<string[]>) {
        let previousIndex = event.previousContainer.data['index'];
        let currentIndex = event.container.data['index']
        if (event.container.data['item']['size'] != 'large') {
            this.cloud_charts[previousIndex] = event.container.data['item']
            this.cloud_charts[currentIndex] = event.previousContainer.data['item']
        } else {
            moveItemInArray(this.cloud_charts, previousIndex, currentIndex);
        }
        this._connect.post(`/admin/reorder-chart`, {'id': this.currentDragDashboardContentId, 'old_order': previousIndex + 1, 'new_order': currentIndex + 1}).subscribe(() => {
        }).add(() => {
            this.load()
            console.log('done')
            //this.reordering_done.emit();
        })
    }
    contentColSpace(originalContent,addContent){
        let contentSize=0;
        originalContent.forEach(content => {
            contentSize=contentSize+content.col_size;
        });
        // contentSize=contentSize+addContent[0].col_size;
        return contentSize;

    }

    getPossibleContentColSize( contents, from_contents = false){
        if (contents.length == 2){
            if(from_contents) return 6;
            return 4;
        }
        if (contents.length == 1){
            if(from_contents) return 12;
            return 6;
        }
        return 12;
    }

    changePossibleContentColSize(to_contents,from_content,event){
        if(to_contents.length < 3){
            let colSize = this.getPossibleContentColSize(to_contents);
            event.item.data.col_size = colSize;
            to_contents.forEach(content => {
                content.col_size = colSize;
            });

            from_content = from_content.filter((content)=> content.id != event.item.data.id )
            colSize = this.getPossibleContentColSize(from_content,true);
            from_content.forEach(content => {
                content.col_size = colSize;
            });
        }
    }

    dropcontents(event: CdkDragDrop<string[]>, field, dropped_index) {
        this.placeholder_visible = false;
        let start_y = event.item.data.y;
        let end_y;
        if (event.previousContainer === event.container) {
            if (event.previousIndex != event.currentIndex) {
                end_y = start_y;
                moveItemInArray(this.group_dashboard_contents[end_y - 1], event.previousIndex, event.currentIndex)
                if (this.group_dashboard_contents[end_y - 1].length != 0) {
                    for (let i = 0; i < this.group_dashboard_contents[end_y - 1].length; i++) {
                        //Change Possible Content ColSize
                        let colSize = 4;
                        if (this.group_dashboard_contents[end_y - 1].length == 2) {
                            colSize = 6
                        }
                        if (this.group_dashboard_contents[end_y - 1].length == 1) {
                            colSize = 12
                        }

                        this.group_dashboard_contents[end_y - 1][i].col_size = colSize;
                        this.group_dashboard_contents[end_y - 1][i].x = i + 1;
                        this.group_dashboard_contents[end_y - 1][i].updated = 1;
                    }
                }
            }
            // this.updateDashboardContentsAfterDragAndDrop();
        } else {
            if (field.length == 0) {
                end_y = dropped_index + 1;
            } else {
                end_y = field[0].y;
            }
            if (this.group_dashboard_contents[end_y - 1].length <= 3) {
                //Change Possible Content ColSize for Previous Contetnts and Current Contents
                this.changePossibleContentColSize(this.group_dashboard_contents[end_y - 1],this.group_dashboard_contents[start_y - 1],event);

                let contentColSize=this.contentColSpace(this.group_dashboard_contents[end_y - 1],this.group_dashboard_contents[start_y - 1]);
                if(contentColSize<12){ // check col size 12
                    transferArrayItem(this.group_dashboard_contents[start_y - 1], this.group_dashboard_contents[end_y - 1], event.previousIndex, event.currentIndex)
                    if (end_y != start_y) {
                        for (let i = 0; i < this.group_dashboard_contents[end_y - 1].length; i++) {
                            //this is check size for drag and drop
                            //this.group_dashboard_contents[end_y - 1][i].col_size = 12/this.group_dashboard_contents[end_y - 1].length;
                            this.group_dashboard_contents[end_y - 1][i].x = i + 1;
                            this.group_dashboard_contents[end_y - 1][i].updated = 1;
                            this.group_dashboard_contents[end_y - 1][i].y = end_y;
                        }
                    }

                    if (this.group_dashboard_contents[start_y - 1].length != 0) {
                        for (let i = 0; i < this.group_dashboard_contents[start_y - 1].length; i++) {
                            // this is check size for drag and drop old container
                            //this.group_dashboard_contents[start_y - 1][i].col_size = 12/this.group_dashboard_contents[start_y - 1].length;
                            this.group_dashboard_contents[start_y - 1][i].x = i + 1;
                            this.group_dashboard_contents[start_y - 1][i].updated = 1;
                        }
                    }

                    if (
                        this.group_dashboard_contents[start_y - 1].length == 0 &&
                        start_y - 1 != this.group_dashboard_contents.length - 1
                    ) {
                        for (let i = start_y - 1; i < this.group_dashboard_contents.length; i++) {
                            if (i != this.group_dashboard_contents.length - 1) {
                                this.group_dashboard_contents[i] = this.group_dashboard_contents[i + 1];
                                this.group_dashboard_contents[i].map((field) => {
                                    field.y = i + 1;
                                    field.updated = 1;
                                });
                            } else {
                                this.group_dashboard_contents[i] = [];
                            }
                        }
                    }
                    // this.updateDashboardContentsAfterDragAndDrop();
                }
                else {
                    this.toasterService.clear();
                    this.toasterService.error('コンテンツのサイズが十分なスペースではありません!');
                }
            }
            else{
                this.toasterService.clear();
                this.toasterService.error('1行に４項目まで配置可能です。');
            }
        }
    }

    updateDashboardContentsAfterDragAndDrop(){
        this._connect.post(`/admin/update-dashboard-content`, {'dashboardContents': this.group_dashboard_contents}).subscribe(() => {
        }).add(() => {
            this.load()
        })
    }

    isShowContents(content) {
        if (!content) {
            return false;
        }
        return true;
    }

    isDragDrop(isCheckValue:boolean) {
        if( !this.changeDragDrop )this.updateDashboardContentsAfterDragAndDrop();
        this.changeDragDrop = isCheckValue;
    }

    handleMoveButton(current_index,type = 'prev'){

        let currentIndex,previousIndex;
        if( type == 'prev' ){
            currentIndex = (current_index - 1);
            previousIndex = current_index;
        }
        if( type == 'next' ){
            currentIndex =  current_index+1;
            previousIndex = current_index;
        }

        this.dropnav(null,currentIndex,previousIndex)
    }

    dropnav($event = null, currentIndex = 0, previousIndex = 0) {

        if($event){
            currentIndex = $event.currentIndex;
            previousIndex = $event.previousIndex;
        }
        if(currentIndex != previousIndex){
            moveItemInArray(this.dashboard_a, previousIndex, currentIndex);
            this._connect.post('/admin/dashboard/update-dashboard-order-drag-drop', {'dashboard_a': this.dashboard_a}).subscribe(
                (jsonData) => {
                    if (jsonData['result'] === 'success') {
                        this.toasterService.success('タブを移動しました', '成功');
                        this.load()
                    } else {
                        this.toasterService.error(jsonData['error_a'], 'エラー');
                    }
                }, (error) => {
                }
            );
        }
    }

    postFtp() {
        if (!window.confirm('FTP対象テーブルを手動更新しますか？')) return;
        this._connect.post('/admin/post-ftp', {}).subscribe(
            (jsonData) => {
                if (jsonData['result'] === 'success') {
                    this.toasterService.success('各テーブル更新を開始しました。更新中はテーブルが空になります。', '成功');
                } else {
                    this.toasterService.error(jsonData['error_a'], 'エラー');
                }
            }, (error) => {
            }
        );
    }

    goPigeonAi($event) {
        $event.preventDefault();
        this._router.navigate([this._share.getAdminTable(), 'dataset', {action: 'pigeonAi'}]);
    }

    viewmodalopen(evt) {
        this.table_info = evt.tbinfo;
        this.selectDataById(evt.id)
    }

    selectDataById(data_id) {
        this._connect.get('/admin/view/' + this.table_info.table + '/' + data_id).subscribe((_data) => {

            this.selectedData = new Data(this.table_info)
            this.selectedData.setInstanceData(_data['data']);
            this._share.setCurrentData(this.selectedData, this.table_info);

            this.viewModal.show()

        });
    }

    resetUrl() {
        history.replaceState({}, null, document.location.pathname)
    }

    viewmodalhide() {
        history.replaceState({}, null, document.location.pathname)
        this.viewModal.hide()
    }

    goToEdit() {
        this._router.navigate([this._share.getAdminTable(), this.table_info.table, 'edit', this.selectedData.getId()]);
    }

}
