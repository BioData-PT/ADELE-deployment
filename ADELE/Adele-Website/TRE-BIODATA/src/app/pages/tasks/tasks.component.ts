import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-tasks',
  imports: [CommonModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss'
})
export class TasksComponent {
  tasks: any[] = [];

  constructor( private router: Router, private taskService: TaskService ) { }
  ngOnInit() {
    this.taskService.getUserTasks().subscribe(
      (data) => {
        console.log('Tasks fetched successfully:', data);
        this.tasks = data;
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );
  }

  createTask(){
    this.router.navigate(['/tasks/new']);
  }

  refreshTasks() {
    this.taskService.getUserTasks().subscribe(
      (data) => {
        console.log('Tasks refreshed successfully:', data);
        this.tasks = data;
      },
      (error) => {
        console.error('Error refreshing tasks:', error);
      }
    );
  }

  generatePresignedUri(task: any) {
    this.taskService.generatePresignedUri(task.user, task.file_id).subscribe(
      (data) => {
        console.log('Presigned URI generated successfully:', data);
        window.open(data.presigned_uri, '_blank');
      },
      (error) => {
        console.error('Error generating presigned URI:', error);
      }
    );
  }
}
