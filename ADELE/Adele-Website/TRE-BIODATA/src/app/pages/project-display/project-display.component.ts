import { Component } from '@angular/core';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectsService } from '../../services/projects.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-project-display',
  imports: [ProjectListComponent],
  templateUrl: './project-display.component.html',
  styleUrl: './project-display.component.scss'
})
export class ProjectDisplayComponent {

  projects: any[] = []

  constructor(private projectsService: ProjectsService, private router: Router) {
    this.projectsService.getProjects().subscribe((data: any) => {
      console.log(JSON.parse(data))
      this.projects = JSON.parse(data);
    }
    );
  }

  
  ngOnInit() {
  }

  createProject() {
    this.router.navigate(['projects', 'new']);
  }
    

}
