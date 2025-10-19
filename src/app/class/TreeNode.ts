export class TreeNode {
    id: string;
    data_id: string;
    group_id:string;
    parent_group_id:string;
    name: string;
    isDir: boolean;
    delete_lock: boolean = false;
    group_delete_lock: boolean = false;
    children: TreeNode[];
    isExpanded: boolean;
    archive_flag: boolean;
    constructor(id, data_id, name, isDir, archive_flag = false, group_id = '0', parent_group_id='0') {
        this.id = id;
        this.data_id = data_id;
        this.name = name;
        this.isDir = isDir;
        this.children = [];
        this.isExpanded = true;
        this.archive_flag = archive_flag;
        this.group_id = group_id;
        this.parent_group_id = parent_group_id;
    }

    setDeleteLock( delete_lock :boolean){
        this.delete_lock = delete_lock;
    }

    setGroupDeleteLock(group_delete_lock :boolean){
        this.group_delete_lock = group_delete_lock;
    }

    append(child) {
        this.children.push(child);
        return child;
    }
}
