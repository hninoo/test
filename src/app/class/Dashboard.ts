import {DashboardContent} from './DashboardContent';

export class Dashboard {
    private _id: number = null;
    private _name: string = null;

    private _has_view_grant: boolean = null;
    private _has_edit_grant: boolean = null;

    private _dashboard_content_a: Array<DashboardContent> = []

    public setByHash(hash) {

        this._id = hash['id'];
        this._name = hash['name'];
        this._has_view_grant = hash['grant']['view'];
        this._has_edit_grant = hash['grant']['edit'];

        hash['dashboard_contents'].forEach(content_hash => {
            let content = new DashboardContent()
            content.setByHash(content_hash)
            this._dashboard_content_a.push(content)
        })


    }


    get id(): number {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get has_view_grant(): boolean {
        return this._has_view_grant;
    }

    get has_edit_grant(): boolean {
        return this._has_edit_grant;
    }


    get dashboard_content_a(): Array<DashboardContent> {
        return this._dashboard_content_a;
    }
}
