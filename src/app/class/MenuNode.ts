export class MenuNode {
    id: string;
    name: string;
    data_id: string;
    menu: any;
    isDir: boolean;
    hasChildDir: boolean;
    children: MenuNode[];
    depth: number;
    badge_total: number;
    isActive: boolean;
    show_group_edit: boolean;
    group_delete_lock: boolean;
    archive_flag: boolean;
    group_id: number;
    parent_group_id: number;

    constructor(id: string, name: string, group_id= 0, parent_group_id = 0) {
        this.id = id;
        this.name = name;
        this.isDir = true;
        this.hasChildDir = false;
        this.children = [];
        this.depth = 0;
        this.isActive = false;
        this.archive_flag = false;
        this.show_group_edit = false; // グループ編集画面で表示するか
        this.parent_group_id = parent_group_id;
        this.group_id = group_id;
        if (this.id.indexOf('dataset__') === 0) {
            this.data_id = this.id.replace('dataset__', '');
        } else if (this.id.indexOf('group__') === 0) {
            this.data_id = this.id.replace('group__', '');
        } else {
            this.data_id = null;
        }
    }
    public setMenu(menu) {
        this.menu = menu;
        this.isDir = false;
        this.archive_flag = menu.archive_flag;
        this.group_id = menu.dataset_group_id ? menu.dataset_group_id : 0;
    }
    public setShowGroupEdit (value: boolean) {
        this.show_group_edit = value;
    }

    public setGroupDeleteLock (value ) {
        this.group_delete_lock = value;
    }

    public append(child) {
        child.depth = this.depth + 1;
        this.children.push(child);
        return child
    }
    public find(id: string, breadcrumbs: any[] = []): { node: MenuNode, breadcrumbs: any[] } {
        const bread = { id: this.id, name: this.name };
        if (this.isDir ) {
            bread['link'] = '/admin/group/' + this.id;
        } else {
            bread['link'] = '/admin/' + this.id;
        }
        const breadcrumbs_new = breadcrumbs.concat(bread);
        return this.id === id ? ({ node: this, breadcrumbs: breadcrumbs_new }) :
            (this.children || [])
                .map(child => child.find(id, breadcrumbs_new))
                .find(x => !!x.node) || ({ node: null, breadcrumbs: [] });
    }
    public setBadgeTotal() {
        if (this.isDir) {
            this.badge_total = (this.children || []).map(child => child.setBadgeTotal()).reduce( (a, b) => { return a + b; });
            return this.badge_total;
        } else {
            return (!!this.menu.badge_text) ? parseInt(this.menu.badge_text, 10) : 0;
        }
    }
    public setHasChildDir() {
        if (this.isDir) {
            let hasChildDir = false;
            this.children.forEach((child) => {
                if (child.isDir) {
                    hasChildDir = true;
                    child.setHasChildDir();
                }
                //archive for group if children archive_flag is not some false.
                if (child.children.length > 0) {
                    let checkMultiChild = (childItem)=>{
                        return childItem.children.some((m_child) => {
                            if (m_child.isDir) return checkMultiChild(m_child);
                            return m_child.menu.archive_flag == false;
                        });
                    }
                    let childItems = child.children.filter(childItem => {
                        if (childItem.isDir) {
                            return checkMultiChild(childItem)
                        }
                        return childItem.menu.archive_flag == "false" || childItem.menu.archive_flag == false

                    });
                    if (childItems.length == 0) child.archive_flag = true;
                }
            });
            this.hasChildDir = hasChildDir;
        }
    }
    public setActive(path) {
        if (this.isDir) {
            const hasAcitveChild = (this.children || []).map(child => child.setActive(path)).reduce( (a, b) => { return a || b; });
            if (hasAcitveChild) {
                this.isActive = true;
                return true;
            } else {
                return false;
            }
        } else {
            if (this.menu.link && this.menu.link[0] === path) {
                this.isActive = true;
                return true;
            } else {
                return false;
            }
        }
    }
}
