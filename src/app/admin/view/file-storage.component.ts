import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'admin-file-storage',
    templateUrl: './file-storage.component.html',
})

export class FileStorageComponent {
    public storage_arr = [];
    @Input() storage;
    @Input() origin;
    @Input() db_name;
    public current_folders: string [] = [];

    getFileSize(values, current_folder) {
        if (values != undefined) {
            this.storage_arr = [];
            for (const val of values) {
                let name = val['Key'].split('/')[2];
                this.storage_arr.push({
                    name: name,
                    size: this.formatSize(val['Size'])
                });
            }
            this.storage = this.storage_arr;
            this.current_folders.push(current_folder);
        }
    }

    getOrigin(vales) {
        this.storage = vales;
        this.current_folders = [];
    }

    formatSize($bytes) {
        if ($bytes >= 1073741824) {
            $bytes = Number($bytes / 1073741824).toFixed(3) + ' GB';
        } else if ($bytes >= 1048576) {
            $bytes = Number($bytes / 1048576).toFixed(3) + ' MB';
        } else if ($bytes >= 1024) {
            $bytes = Number($bytes / 1024).toFixed(3) + ' KB';
        } else if ($bytes > 1) {
            $bytes = $bytes + ' bytes';
        } else if ($bytes == 1) {
            $bytes = $bytes + ' byte';
        } else {
            $bytes = '0 bytes';
        }
        return $bytes;
    }

}
