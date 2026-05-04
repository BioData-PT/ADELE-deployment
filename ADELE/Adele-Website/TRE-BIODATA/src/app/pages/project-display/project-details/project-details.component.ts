import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectsService } from '../../../services/projects.service';
import {MatStepperModule} from '@angular/material/stepper';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectFormComponent } from './project-form/project-form.component';
import { FileManagementComponent } from "../../file-management/file-management.component";
import { MetadataFormComponent } from "../../metadata/metadata-form/metadata-form.component";
import { RemsService } from '../../../services/rems.service';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { CodeDisplayComponent } from "../../../components/code-display/code-display.component";
import { DataUploadComponent } from "../../data-upload/data-upload.component";

@Component({
  selector: 'app-project-details',
  imports: [CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatStepperModule,
    ProjectFormComponent,
    MatIconModule,
    FileManagementComponent,
    FileManagementComponent,
    MetadataFormComponent,
    MetadataFormComponent,
    MatInputModule,
    MatCardModule, 
    DataUploadComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent {
  project : any;

  steps = [
    { label: 'Project Editing', status: 'P-E', content: 'projectDetails' },
    { label: 'Project Awaiting Review', status: 'P-AR', content: null },
    { label: 'Project Rejected', status: 'P-R', content: null },
    
     { label: 'Agreement Editing', status: 'A-E', form:  null, content: 'agreementForm' },
    { label: 'Agreement Awaiting Review', status: 'A-AR', content: null },
    { label: 'Agreement Rejected', status: 'A-R', content: null },

    { label: 'Metadata Editing', status: 'M-E', form: null , content: 'metadataForm' },
    { label: 'Metadata Awaiting Review', status: 'M-AR', content: null },
    { label: 'Metadata Rejected', status: 'M-R', content: null },
    
    { label: 'Data Editing', status: 'D-E', content: 'dataSubmissionGuide' },
    { label: 'Data Awaiting Review', status: 'D-AR', content: null },
    { label: 'Data Rejected', status: 'D-R', content: null },
    
    { label: 'Done', status: 'DONE', content: null }
  ];

    // Mapping of statuses to their respective main steps
    mainSteps = {
      project: ['P-E', 'P-AR', 'P-R'],
       agreement: ['A-E', 'A-AR','A-R'],
       metadata: ['M-E', 'M-AR','M-R'],
      data: ['D-E', 'D-AR','D-R'],
      done: ['DONE']
    };

    resource_name: string = '';
    validationMessage: string = '';

  
  constructor( 
    private projectService: ProjectsService,
    private remsService : RemsService,
    private router : ActivatedRoute){}



  ngOnInit(): void {
    this.router.params.subscribe((params) => {
      if (params['id'] === 'new') {
        this.project = {
          id: 'new',
          title: '',
          description: '',
          deadline: '',
          organization: '',
          responsable:'',
          internal_storage: true,
          status: 'P-E',
          owner: '',          
        };
      } else {
        this.projectService.getProject(params['id']).subscribe((project) => {
          if (!project) {
            console.error('Project not found');
            return;
          }
          console.log('Project: ', project);
          this.project = project;
          this.getMainStepIndex();
        });
      }
    });
  }
  

  getMainStepIndex(): number {
    if (this.mainSteps.project.includes(this.project.status)) return 0;
    if (this.mainSteps.agreement.includes(this.project.status)) return 1;
    if (this.mainSteps.metadata.includes(this.project.status)) return 2;
    if (this.mainSteps.data.includes(this.project.status)) return 3;
    if (this.mainSteps.done.includes(this.project.status)) return 4; 
    return 0;
  }

  isCurrentPhase(phase: keyof typeof this.mainSteps): boolean {
    return this.mainSteps[phase].includes(this.project.status);
  }


}
