import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectsService } from '../../../../services/projects.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ConnectedOverlayPositionChange } from '@angular/cdk/overlay';


@Component({
  selector: 'app-project-form',
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss'
})
export class ProjectFormComponent {
  @Input() project: any;

  projectForm: FormGroup = new FormGroup({});
  isSaved = false;
  user_id = '';
  user_email = '';
  showDeleteModal = false;

  constructor(private fb : FormBuilder, 
    private projectService: ProjectsService, 
    private route : Router, 
    private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.user_id = user.sub;
        this.user_email = user.email;
      }
    });

    const defaultExpirationDate = new Date();
    defaultExpirationDate.setFullYear(defaultExpirationDate.getFullYear() + 50); // Default to 50 years from now

    this.projectForm = this.fb.group({
      id: new FormControl('new'),
      title: new FormControl('', Validators.required, ),
      description: new FormControl('', Validators.required),
      expiration_date: new FormControl(defaultExpirationDate.toISOString().substring(0, 10), Validators.required),
      organization: new FormControl( '', Validators.required),
      status: new FormControl('P-E'),
      responsable: new FormControl(this.user_email, [Validators.required, Validators.email]),
      internal_storage: new FormControl(true, Validators.required),
    });

  }

  onSubmit() {
    if (this.projectForm.valid) {
      console.log('Form Data:', this.projectForm.value); // Log the form data
      if (this.projectForm.value.responsable !== '') {
        
      this.projectService.saveProject(this.projectForm.value).subscribe({
        next: (data: any) => {
          console.log('Project created!');
          this.isSaved = true;
          this.route.navigate(['/projects']);
        },
        error: (error: any) => {
          console.error('Error creating project: ', error);
        }
      });
    }
    }
  }

  isFormLocked(){
    return this.projectForm.get('status')?.value === 'P-AR';
  }

  isInvalid(controlName: string) {
    return this.projectForm.controls[controlName].invalid && (this.projectForm.controls[controlName].dirty || this.projectForm.controls[controlName].touched);
  }

  // Warn the user before navigating away with unsaved changes
  canDeactivate(): boolean {
    if (this.projectForm.dirty && !this.isSaved) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  onCancel(){
    this.route.navigate(['/projects']);
  }

  confirmDelete() {
    this.showDeleteModal = true;
  }

  closeModal() {
    this.showDeleteModal = false;
  }
  
  editProject(){
    this.isSaved = false;
    this.project.status = 'P-E';
    this.projectForm.patchValue(this.project);    
  }

  // On change print the invalid values of the form
  onFormChange() {

    console.log('Responsable value:', this.projectForm.value.responsable); 
    this.projectForm.valueChanges.subscribe(() => {
      const invalidControls = Object.keys(this.projectForm.controls).filter(controlName => 
        this.projectForm.controls[controlName].invalid
      );
      console.log('Invalid controls:', invalidControls);
    });
  }

  contactAdmin() {
    alert('This feature is not available right now, please contact INESC-ID services directly.');
  }


}

