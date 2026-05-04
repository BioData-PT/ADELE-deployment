import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { convertStatus } from '../../shared/utils/status-converter';
import { MatIconModule } from '@angular/material/icon';
import { AgreementsFragmentComponent } from '../projects/agreements-fragment/agreements-fragment.component';
import { MetadataFragmentComponent } from '../projects/metadata-fragment/metadata-fragment.component';
import { Router } from '@angular/router';
import { throwDialogContentAlreadyAttachedError } from '@angular/cdk/dialog';
import { DataUploadFragmentComponent } from '../projects/data-upload-fragment/data-upload-fragment.component';


@Component({
  selector: 'app-project-details',
  imports: [CommonModule, MatIconModule, AgreementsFragmentComponent, MetadataFragmentComponent, DataUploadFragmentComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent {

  projectId!: string;
  project: any; 
  phases = [
    { name: 'Project Creation', status: 'Pending' },
    { name: 'Legal Agreements', status: 'Pending' },
    { name: 'Metadata Submission', status: 'Pending' },
    { name: 'Data Submission', status: 'Pending' }
  ];
  currentPhaseIndex = 0; 

  constructor(
    private route: ActivatedRoute, 
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    // Ideally here you would fetch project full data using ProjectService
    this.projectService.getProject(this.projectId).subscribe(project => {
      this.project = project;
      console.log(this.project);
      this.setupPhasesBasedOnProjectStatus();
    });
  }

  setupPhasesBasedOnProjectStatus() {
    const stageMap: { [key: string]: number } = {
      'P': 0, // Project Creation
      'A': 1, // Legal Agreements
      'M': 2, // Metadata Submission
      'D': 3,  // Data Submission
      'DONE': 4 // Completed
    };

    const mainStage = this.project.status.split('-')[0]; 
    const subStage = this.project.status.split('-')[1];
    this.currentPhaseIndex = stageMap[mainStage] || 0;

    // Set sub-status for each phase as appropriate
    this.phases.forEach((phase, index) => {
      if (index < this.currentPhaseIndex) {
        phase.status = 'Approved'; // Previous phases are approved
      } else if (index === this.currentPhaseIndex) {
        if (subStage === 'E') {
          phase.status = 'Pending'; // Current phase is pending
        } else if (subStage === 'AR') {
          phase.status = 'Awaiting Review'; // Current phase is awaiting review
        } else if (subStage === 'R') {
          phase.status = 'Rejected'; // Current phase is rejected
        }
      }
    });
    console.log(this.phases[this.currentPhaseIndex]);
  }

  get convertedStatus() {
    return convertStatus(this.project.status);
  }



  validateCurrentStep() {
    if (!confirm('Are you sure you want to validate this step?')) {
      return;
    }
    if (this.currentPhaseIndex < this.phases.length) {
      this.projectService.updateProjectStatus(this.projectId, this.getNextPhaseStatusSuccess(this.phases[this.currentPhaseIndex].name)).subscribe(() => {
        console.log('Project status updated successfully!');
        this.phases[this.currentPhaseIndex].status = 'Approved';
        this.currentPhaseIndex++;
        this.reloadCurrentRoute();
      });
    }
  }

  getNextPhaseStatusSuccess(phaseName: string): string {
    const phaseStatusMap: { [key: string]: string } = {
      'Project Creation': "A-E",
      'Legal Agreements': 'M-E',
      'Metadata Submission': 'D-E',
      'Data Submission': 'DONE'
    };
    return phaseStatusMap[phaseName] || 'P-E';
  }

  getNextPhaseStatusFailure(phaseName: string): string {
    const phaseStatusMap: { [key: string]: string } = {
      'Project Creation': "P-R",
      'Legal Agreements': 'A-R',
      'Metadata Submission': 'M-R',
    };
    return phaseStatusMap[phaseName] || 'P-R';
  }

  rejectCurrentStep() {

    if (!confirm('Are you sure you want to reject this step?')) {
      return;
    }
    if (this.currentPhaseIndex < this.phases.length) {
      this.phases[this.currentPhaseIndex].status = 'Rejected';
      this.projectService.updateProjectStatus(this.projectId, this.getNextPhaseStatusFailure(this.phases[this.currentPhaseIndex].name)).subscribe(() => {
        console.log('Project status updated to Rejected!');
      });
    }
    this.setupPhasesBasedOnProjectStatus();
  }

  canValidateCurrentStep(): boolean {    
    if (this.currentPhaseIndex >= this.phases.length) {
      return false; 
    }
    if (this.currentPhaseIndex == 1) {
      if (!this.project.userSignedFiles || this.project.userSignedFiles.length === 0) {
        return false;
      }
    }
    if (this.currentPhaseIndex == 2) {
      if (!this.project.dataset_uri || this.project.distributions_uri.length === 0) {
        return false;
      }
    }

    if (this.currentPhaseIndex == 3) {
     return true;
    }

    if (this.phases[this.currentPhaseIndex]?.status === 'Approved' || this.phases[this.currentPhaseIndex]?.status === 'Rejected') {
      return false;
    }

  return this.phases[this.currentPhaseIndex]?.status === 'Awaiting Review';
}

reloadCurrentRoute() {
  const currentUrl = this.router.url;
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate([currentUrl]);
  });
}


}
