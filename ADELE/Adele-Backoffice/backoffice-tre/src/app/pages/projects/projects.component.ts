import { Component } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProjectService } from '../../services/project.service';
import { convertStatus } from '../../shared/utils/status-converter';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects',
  imports: [MatTableModule, MatIconModule, CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  displayedColumns: string[] = ['title', 'description', 'status', 'actions'];
  projects: any;
  dataSource = new MatTableDataSource<any>([]);

  constructor(private projectService: ProjectService, private router: Router) {
    
  }

  ngOnInit() {
    console.log('ProjectsComponent initialized');
    this.projectService.getProjects().subscribe((projects) => {
      console.log(projects);
      this.projects = projects
      this.dataSource.data = this.projects;
    });
  }

  truncateDescription(description: string, maxLength: number): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }

  getProjectStage(project:any) {
    const status = convertStatus(project.status);
    return status.split('-')[0];
  }

  projectNotification(project:any) {
    console.log(project.status.split('-')[1]);
    return project.status.split('-')[1] == "AR";
  }

  openProject(project:any) {
    console.log('Opening project:', project);
    // Navigate to project details page
    this.router.navigate(['/projects', project.id]);
  }


}

