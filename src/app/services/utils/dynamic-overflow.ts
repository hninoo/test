import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class DynamicOverFlowService {

	overflowHidden: BehaviorSubject<boolean>= new BehaviorSubject(true);

	constructor(){

	}

	accordionChanged(accordionState){
		// console.log(accordionState)
		this.overflowHidden.next(accordionState);
	}



}