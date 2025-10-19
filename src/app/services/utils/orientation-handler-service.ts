import { Injectable } from "@angular/core";

@Injectable()
export class OrientationChangeService{

	constructor(){

	}

	changeFieldOrientation(wide_view_fields,narrow_view_fields){

		let return_fields;
		if(window.screen.orientation.type=='landscape-primary' || window.screen.orientation.type=='landscape-secondary'){
			return_fields = wide_view_fields
        }
        else if(window.screen.orientation.type=='portrait-primary' || window.screen.orientation.type=='portrait-secondary'){
			return_fields = narrow_view_fields
            
        }
		return return_fields;	
	}
}