import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ProjectsService } from '../../../services/projects.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, RouterModule, RouterLink, MatIconModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent {
  @Input() projects: any[] = [];

  mainSteps = {
    project: ['P-E', 'P-AR', 'P-R'],
    agreement: ['A-E', 'A-AR', 'A-R'],
    metadata: ['M-E', 'M-AR', 'M-R'],
    data: ['D-E', 'D-AR', 'D-R'],
    done: ['DONE']
  };

  constructor() {
  }

  ngOnInit(): void {
    console.log('Projects: ', this.projects);
  }

  getMainStepIndex(status: string): number {
    if (this.mainSteps.project.includes(status)) return 0;
    if (this.mainSteps.agreement.includes(status)) return 1;
    if (this.mainSteps.metadata.includes(status)) return 2;
    if (this.mainSteps.data.includes(status)) return 3;
    if (this.mainSteps.done.includes(status)) return 4;
    return 0;
  }

}
