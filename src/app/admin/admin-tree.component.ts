import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {CdkDrag, CdkDragDrop, CdkDragMove, CdkDragRelease, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {Data} from '../class/Data';
import {TableInfo} from '../class/TableInfo';
import {Grant} from '../class/Grant';
import {Connect} from 'app/services/connect';
import {Router} from '@angular/router';
import {TreeNode} from '../class/TreeNode';
import { DragDropService } from 'app/services/drag-drop.service';

@Component({
    selector: 'admin-tree',
    templateUrl: './admin-tree.component.html',
    styleUrls: ['./admin-tree.component.scss']
})

export class AdminTreeComponent implements OnChanges {
    @Input() data_a: Array<Data>;
    @Input() checked_delete_id_a: Array<number> = []
    @Input() export_data: boolean;
    @Input() toasterService;
    @Input() isSummarizeMode: boolean = false;
    @Input() isShowManageCol: boolean = false;
    @Input() is_relation_table: boolean = false;
    @Input() checkboxChange: Function;
    @Input() table_info: TableInfo;
    @Input() isEditMode: boolean;
    @Input() openDeleteModal: Function;
    @Input() openGroupDeleteModal: Function;
    @Input() reset_tree: boolean = false;
    @Input() switchGroupEdit: boolean;
    @Input() group_edit_data_a;
    @Input() is_group_opening: { [group: string]: boolean };
    @Input() group_edit_data;
    @Input() group_sort_data_a;
    @Input() menu_root;
    @Input() share;
    @Output() onGroupChange = new EventEmitter();
    @Output() openDuplicateModal = new EventEmitter();

    @ViewChild('relationConfirmModal') relationConfirmModal: any;
    @ViewChild('groupDeleteModal') groupDeleteModal: any;
    private relationChecked = 'false';

    public show_archive_table: boolean;

    public grant: Grant;
    public sorted_data_a: Array<Data> = [];
    private new_group_count: number = 1;
    private _connect: Connect;
    public second_stages: Array<string> = [];
    public second_stages_id: Array<String> = [];
    public data_by_id = {};
    public tree: TreeNode;
    public order: number;
    public ordered_dataset: Array<any>;
    public update_group_with_parent: Array<any>;
    dropTargetIds = [];
    nodeLookup = {};

    constructor(_connect: Connect, private _router: Router, public dragDropService: DragDropService) {
        this._connect = _connect;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.data_a && changes.reset_tree) this.resetTree();
        if (changes.data_a) {
            this.sortGroupDataset();
            let i = 0;
            this.group_edit_data.forEach(element => {
                i++;
                this.second_stages.push('second-stage-' + i);
                this.is_group_opening[element.group] = false
            });
            this.second_stages.push('first-stage');
            this.second_stages.push('remove_container');
            this.grant = this.table_info.grant;
            this.changeAllGroupOpenClose(true);
            this.data_a.forEach((data) => {
                this.data_by_id[data['raw_data']['id']] = data;
            });
            this.resetTree();
        }
        if (changes.menu_root) {
            this.resetTree();
        }
    }

    public get connectedLists() {
        return this.dragDropService.dropLists;
    }
    allowDropPredicate = (drag: CdkDrag, drop: CdkDropList) => {
        return this.dragDropService.isDropAllowed(drag, drop);
    }

    dragMoved(event: CdkDragMove<any>) {
        this.dragDropService.dragMoved(event);
    }

    dragReleased(event: CdkDragRelease) {
        this.dragDropService.dragReleased(event);
    }

    getIds(node){
        this.dragDropService.register(node.id);
        return node.id
    }

    resetTree() {
        this.tree = new TreeNode('root', 'root', '(ルートディレクトリ)', true);
        this.setNodes(this.tree, this.menu_root ? this.menu_root.children:[]);
        this.reset_tree = false;
    }
    isArchived(node):boolean{
        if (node.archive_flag && !this.show_archive_table) return true;
        return false;
    }

    setNodes(parent, nodes) {
        nodes.forEach(node => {
            if (node.show_group_edit) {
                const child = new TreeNode(node.id, node.data_id, node.name, node.isDir, node.archive_flag, node.group_id, node.parent_group_id);
                //set delet_lock on TreeNode when delete_lock is true on MenuNode
                if( node.menu && node.menu.delete_lock ) child.setDeleteLock(true);

                if (node.group_delete_lock) {
                    child.setGroupDeleteLock( true );
                }
                
                parent.append(child);
                this.setNodes(child, node.children);
            }
        });
    }

    prepareDragDrop(nodes: TreeNode[]) {
        nodes.forEach(node => {
            if (!this.dropTargetIds.includes(node.id)) {
                if (node.isDir) {
                    this.dropTargetIds.push(node.id);
                    this.prepareDragDrop(node.children);
                }
            }
            this.nodeLookup[node.id] = node;
        });
    }

    sortGroupDataset() {
        //order順にdata_aを並び替える

        //without this line is a bug when u call reload page in admin.component.ts line 1081
        this.group_edit_data = [];

        this.sorted_data_a = this.data_a;
        this.sorted_data_a.sort(function (a, b) {
            var keyA = Number(a['raw_data']['order']),
                keyB = Number(b['raw_data']['order']);
            // Compare the 2 dates
            if (keyA < keyB) {
                return -1;
            }
            if (keyA > keyB) {
                return 1;
            }
            return 0;
        });

        this.sorted_data_a.forEach((dataset, key) => {
            let group_next_index: number = this.group_edit_data.length;
            if (dataset['raw_data']['group'] == null) {
                this.group_edit_data[group_next_index] = dataset;
            } else if (key != 0 && this.isKey(dataset['raw_data']['group']).is_key) {
                this.group_edit_data[this.isKey(dataset['raw_data']['group']).group_id]['data_a'].push(dataset);
            } else {
                this.group_edit_data[group_next_index] = [];
                this.group_edit_data[group_next_index]['group'] = dataset['raw_data']['group'];
                this.group_edit_data[group_next_index]['data_a'] = [];
                this.group_edit_data[group_next_index]['data_a'].push(dataset);
                //make formcontrol
                this.group_edit_data[group_next_index]['formControl'] = new FormControl(dataset['view_data']['group']);
                this.group_edit_data[group_next_index]['group_id'] = dataset['raw_data']['dataset_group_id'];
            }
        });

        // second-stageのidを作成
        this.group_edit_data.forEach((data, key) => {
            this.second_stages_id[key] = 'second-stage-' + key;
        });

        // console.log('sorted_data_a');
        // console.log(this.sorted_data_a);
    }

    openRelationConfirmModal() {
        this.relationConfirmModal.show();
    }

    hideRelationConfirmModal() {
        this.relationConfirmModal.hide();

    }

    isKey(group_name: string) {
        let search_results: { is_key: boolean, group_id: number } = {is_key: false, group_id: 0};
        for (let i = 0; i < this.group_edit_data.length; i++) {
            if (this.group_edit_data[i]['group'] == group_name) {
                search_results.is_key = true;
                search_results.group_id = i;
            }
        }
        return search_results;
    }

    clickGroup(key: string) {
        this.is_group_opening[key] = !this.is_group_opening[key];
    }

    clickGroupAdd() {
        while (this.isKey('新規グループ' + this.new_group_count).is_key) {
            this.new_group_count++;
        }
        let new_group_edit_data_one = new Array();
        new_group_edit_data_one['group'] = '新規グループ' + this.new_group_count;
        new_group_edit_data_one['data_a'] = [];
        new_group_edit_data_one['formControl'] = new FormControl('新規グループ' + this.new_group_count);
        new_group_edit_data_one['group_id'] = this.getNewRandomId();
        this.group_edit_data.push(new_group_edit_data_one);
        this.new_group_count = 1;
    }

    private getNewRandomId() {
        var number = Math.random() // 0.9394456857981651
        number.toString(36); // '0.xtis06h6'
        var id = number.toString(36).substr(2, 14); // 'xtis06h6'
        return 'new_' + id;
    }

    groupChange() {
        this.onGroupChange.emit({'group_edit_data': this.group_edit_data});
    }


    firstDrop(event: CdkDragDrop<Array<Data>>) {
        console.log('firstDrop');
        console.log(event);

        if (event.previousContainer == event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex);
        }
        this.onGroupChange.emit({'group_edit_data': this.group_edit_data});

    }

    secondDrop(event: CdkDragDrop<Array<Data>>) {
        console.log('secondDrop');
        console.log(event);

        if (event.previousContainer == event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (event.previousContainer != event.container && event.previousContainer.data[event.previousIndex]['group'] == undefined) {
            transferArrayItem(event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex);
        } else if (event.previousContainer != event.container && event.previousContainer.data[event.previousIndex]['group'] != undefined) {
            this.toasterService.error('この操作はできません', 'エラー');
        }
        this.onGroupChange.emit({'group_edit_data': this.group_edit_data});
    }

    parseIntCo(id) {
        return parseInt(id);
    }

    removeFromGroup(event: CdkDragDrop<Array<Data>>) {
        transferArrayItem(event.previousContainer.data,
            this.group_edit_data,
            event.previousIndex,
            100000);  //最後に追加
        this.onGroupChange.emit({'group_edit_data': this.group_edit_data});
    }

    public changeAllGroupOpenClose(is_open = true) {
        this.group_edit_data.forEach(data => {
            this.is_group_opening[data.group] = is_open
        })

    }

    getLink(data) {
        if (data['raw_data']['system_table']) {
            return '/admin/' + data['raw_data']['system_table']
        }
        return '/admin/dataset__' + data['raw_data']['id'];
    }

    copy(data: Data) {
        this.openDuplicateModal.emit({
            'duplicate_data': data
        });
        //this._router.navigate(['admin', 'dataset', 'edit', 'new', {ref: data['raw_data']['id']}]);
    }

    goGroupEdit($event, group) {
        $event.stopPropagation()
        console.log(group)
        this._router.navigate(['admin', 'dataset_group', 'edit', group['group_id']]);
    }
    goGroupEditById($event, group_id) {
        $event.stopPropagation()
        this._router.navigate(['admin', 'dataset_group', 'edit', group_id]);
    }

    allCheck(event, group_id) {
        let checked = event.target.checked
        const checkbox_a = document.getElementsByName('data_check');
        let group_data = [];
        for (let j = 0; j < this.group_edit_data.length; j++) {
            if (this.group_edit_data[j]['group_id'] == group_id) {
                group_data = group_data.concat(this.group_edit_data[j]['data_a']);
                break;
            }
        }
        for (let k = 0; k < group_data.length; k++) {
            for (let i = 0; i < checkbox_a.length; i++) {
                if (group_data[k]['raw_data']['id'] == checkbox_a[i]['defaultValue']) {
                    const checkbox = <HTMLInputElement>checkbox_a[i];
                    checkbox.checked = checked
                }
            }
        }
        this.checkboxChange();
    }

    openClose(event) {
        event.stopPropagation();
    }

    // dragMoved(event) {
    // }
    drop(event: CdkDragDrop<[]>, group_id,parent_group_id) {

        if(group_id == 'root'){
            event.item.data.group_id = 0;
            event.item.data.parent_group_id = 0
        }else{
            event.item.data.group_id = group_id;
            event.item.data.parent_group_id = group_id ? group_id : parent_group_id;
        }
        this.dragDropService.drop(event);
    }
    setOrder(node) {
        if ( !node.isDir ) {
            let group_id = node.group_id;
            this.ordered_dataset.push({ 'id': node.data_id, 'name': node.name, 'order': ++this.order, group_id });
        } else if ( node.children.length > 0 ) {
            if(node.data_id != 'root' && !this.update_group_with_parent.find((group)=>group.id==node.data_id)){
                this.update_group_with_parent.push({
                    'id': node.data_id,
                    'parent_group_id': node.parent_group_id
                });
            }
            node.children.forEach( node => {
                this.setOrder(node);
            });
        }
    }
    groupEdit() {
        if (this.switchGroupEdit) {
            this.ordered_dataset = [];
            this.update_group_with_parent = [];
            this.order = 1;
            this.setOrder(this.tree);
            const url = this._connect.getApiUrl() + '/admin/group-edit/dataset-order';
            this._connect.post(url, { update_group_with_parent: this.update_group_with_parent,ordered_dataset: this.ordered_dataset}).subscribe((data: any) => {
                this.toasterService.success('グループ名を変更しました。', '成功');
                location.reload();
                this.switchGroupEdit = false;
            });
        } else {
            this.switchGroupEdit = true;
        }
    }

    groupEditCancel() {
        this.toasterService.success('メニュー並び替えをキャンセルしました。', '成功');
        this.resetTree();
        this.switchGroupEdit = false;
    }
    openAllGroup() {
        const elems = document.getElementsByClassName('admin-tree__dir');
        for ( let i = 0; i < elems.length; i++) {
            const ele_cls = elems[i].classList;
            ele_cls.add('open');
            ele_cls.add('show');
        }
        const toggle_elems = document.getElementsByClassName('admin-tree__dir-toggle');
        for ( let i = 0; i < elems.length; i++) {
            toggle_elems[i].setAttribute('aria-expanded', 'true');
        }
    }
    closeAllGroup() {
        const elems = document.getElementsByClassName('admin-tree__dir');
        for ( let i = 0; i < elems.length; i++) {
            const ele_cls = elems[i].classList;
            ele_cls.remove('open');
            ele_cls.remove('show');
        }
        const toggle_elems = document.getElementsByClassName('admin-tree__dir-toggle');
        for ( let i = 0; i < elems.length; i++) {
            toggle_elems[i].setAttribute('aria-expanded', 'false');
        }
    }
}


