import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

import { ChildFormsComponent } from './child-forms.component';
import { TableInfo } from '../../class/TableInfo';
import { Form } from '../../class/Form';

describe('ChildFormsComponent', () => {
  let component: ChildFormsComponent;
  let fixture: ComponentFixture<ChildFormsComponent>;
  let mockEditComponent: any;
  let mockChildTable: TableInfo;
  let mockForm: Form;

  beforeEach(async () => {
    // Create mock objects
    mockEditComponent = {
      canAddChildData: jasmine.createSpy('canAddChildData').and.returnValue(true),
      addChildData: jasmine.createSpy('addChildData'),
      onCsvFileSelected: jasmine.createSpy('onCsvFileSelected'),
      orderChange: jasmine.createSpy('orderChange'),
      clickToDeleteChild: jasmine.createSpy('clickToDeleteChild'),
      duplicateChild: jasmine.createSpy('duplicateChild'),
      onLoadReflectFormsFromChild: jasmine.createSpy('onLoadReflectFormsFromChild'),
      data: {
        child_data_by_table: {
          'test_table': [
            { raw_data: { id: 1 } },
            { raw_data: { id: 2 } }
          ]
        }
      },
      child_error_a_by_table: {
        'test_table': [{}, {}]
      },
      mode: 'edit',
      is_dataset_edit: false,
      IS_PUBLIC_FORM: false,
      IS_EMBED_MODE: false,
      IS_IFRAME_MODE: false,
      show_google_calendar: false,
      table_info: {},
      forms: {}
    };

    mockChildTable = {
      table: 'test_table',
      getLabel: jasmine.createSpy('getLabel').and.returnValue('Test Table'),
      menu: { multiple_mode: 'normal' },
      grant: { delete: true },
      forms: {
        byFieldName: jasmine.createSpy('byFieldName').and.returnValue({})
      },
      order_field: 'order',
      fields: []
    } as any;

    mockForm = {
      original_type: 'select_other_table',
      is_child_form: true,
      custom_field: { 'is_child_form': true }
    } as any;

    await TestBed.configureTestingModule({
      declarations: [ ChildFormsComponent ],
      imports: [ NgbModule, BsDropdownModule.forRoot() ],
      schemas: [ NO_ERRORS_SCHEMA ] // Allows unknown elements like admin-forms
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildFormsComponent);
    component = fixture.componentInstance;
    
    // Set up component inputs
    component.form = mockForm;
    component.child_table = mockChildTable;
    component.editComponent = mockEditComponent;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should warn when required inputs are missing', () => {
      spyOn(console, 'warn');
      component.form = null;
      component.editComponent = null;
      
      component.ngOnInit();
      
      expect(console.warn).toHaveBeenCalledWith('ChildFormsComponent: Required inputs are missing');
    });

    it('should not warn when all inputs are present', () => {
      spyOn(console, 'warn');
      
      component.ngOnInit();
      
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should log when child_table changes', () => {
      spyOn(console, 'log');
      const changes = {
        child_table: {
          currentValue: mockChildTable,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };
      
      component.ngOnChanges(changes);
      
      expect(console.log).toHaveBeenCalledWith('Child table changed:', 'test_table');
    });
  });

  describe('isValidChildForm getter', () => {
    it('should return true for valid child form', () => {
      expect(component.isValidChildForm).toBe(true);
    });

    it('should return false when form is missing', () => {
      component.form = null;
      expect(component.isValidChildForm).toBe(false);
    });

    it('should return false when form is not select_other_table', () => {
      component.form.original_type = 'text';
      expect(component.isValidChildForm).toBe(false);
    });

    it('should return false when is_child_form is false', () => {
      component.form['is_child_form'] = false;
      expect(component.isValidChildForm).toBe(false);
    });

    it('should return false when child_table is missing', () => {
      component.child_table = null;
      expect(component.isValidChildForm).toBe(false);
    });

    it('should return false when menu is missing', () => {
      component.child_table.menu = null;
      expect(component.isValidChildForm).toBe(false);
    });

    it('should return false when multiple_mode is not normal', () => {
      component.child_table.menu.multiple_mode = 'other';
      expect(component.isValidChildForm).toBe(false);
    });
  });

  describe('childData getter', () => {
    it('should return child data array', () => {
      const result = component.childData;
      expect(result).toEqual([
        { raw_data: { id: 1 } },
        { raw_data: { id: 2 } }
      ]);
    });

    it('should return empty array when editComponent is missing', () => {
      component.editComponent = null;
      expect(component.childData).toEqual([]);
    });

    it('should return empty array when child_table is missing', () => {
      component.child_table = null;
      expect(component.childData).toEqual([]);
    });

    it('should return empty array when data is missing', () => {
      component.editComponent.data = null;
      expect(component.childData).toEqual([]);
    });
  });

  describe('hasChildData getter', () => {
    it('should return true when child data exists', () => {
      expect(component.hasChildData).toBe(true);
    });

    it('should return false when no child data', () => {
      component.editComponent.data.child_data_by_table['test_table'] = [];
      expect(component.hasChildData).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should render when valid child form', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pfc-child-container')).toBeTruthy();
    });

    it('should not render when invalid child form', () => {
      component.form = null;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.pfc-child-container')).toBeFalsy();
    });

    it('should display child table label', () => {
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Test Table');
    });

    it('should render add button', () => {
      const compiled = fixture.nativeElement;
      const addButton = compiled.querySelector('.btn-success');
      expect(addButton).toBeTruthy();
      expect(addButton.textContent).toContain('Test Tableを追加する');
    });

    it('should disable add button when canAddChildData returns false', () => {
      mockEditComponent.canAddChildData.and.returnValue(false);
      fixture.detectChanges();
      
      const addButton = fixture.nativeElement.querySelector('.btn-success');
      expect(addButton.disabled).toBe(true);
    });

    it('should render child containers for each data item', () => {
      const compiled = fixture.nativeElement;
      const childContainers = compiled.querySelectorAll('.child-container');
      expect(childContainers.length).toBe(2);
    });

    it('should render order buttons when order field exists', () => {
      const compiled = fixture.nativeElement;
      const orderButtons = compiled.querySelectorAll('.btn-default');
      expect(orderButtons.length).toBe(4); // 2 items × 2 buttons each (up/down)
    });

    it('should not render order buttons when order field is missing', () => {
      mockChildTable.forms.byFieldName.and.returnValue(null);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const orderButtons = compiled.querySelectorAll('.btn-default');
      expect(orderButtons.length).toBe(0);
    });

    it('should render delete and duplicate buttons', () => {
      const compiled = fixture.nativeElement;
      const deleteButtons = compiled.querySelectorAll('.btn-danger');
      const duplicateButtons = compiled.querySelectorAll('.btn-info');
      
      expect(deleteButtons.length).toBe(2);
      expect(duplicateButtons.length).toBe(2);
    });

    it('should disable delete button when no delete permission and item has id', () => {
      mockChildTable.grant.delete = false;
      fixture.detectChanges();
      
      const deleteButtons = fixture.nativeElement.querySelectorAll('.btn-danger');
      expect(deleteButtons[0].disabled).toBe(true);
    });
  });

  describe('button interactions', () => {
    it('should call addChildData when add button is clicked', () => {
      const addButton = fixture.nativeElement.querySelector('.btn-success');
      addButton.click();
      
      expect(mockEditComponent.addChildData).toHaveBeenCalledWith(
        mockChildTable, undefined, undefined, 2
      );
    });

    it('should call orderChange when order up button is clicked', () => {
      const orderUpButton = fixture.nativeElement.querySelector('.btn-default');
      orderUpButton.click();
      
      expect(mockEditComponent.orderChange).toHaveBeenCalledWith(
        component.childData, 0, -1
      );
    });

    it('should call clickToDeleteChild when delete button is clicked', () => {
      const deleteButton = fixture.nativeElement.querySelector('.btn-danger');
      deleteButton.click();
      
      expect(mockEditComponent.clickToDeleteChild).toHaveBeenCalledWith(
        mockChildTable, 0
      );
    });

    it('should call duplicateChild when duplicate button is clicked', () => {
      const duplicateButton = fixture.nativeElement.querySelector('.btn-info');
      duplicateButton.click();
      
      expect(mockEditComponent.duplicateChild).toHaveBeenCalledWith(
        mockChildTable, 0
      );
    });
  });
});