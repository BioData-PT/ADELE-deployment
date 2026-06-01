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

  viewOutput(task: any) {
    task.outputError = '';
    this.taskService.getTaskResult(task.user || task.user_id, task.file_id).subscribe(
      (content) => {
        task.output = content;
      },
      (error) => {
        console.error('Error fetching task output:', error);
        task.outputError = 'Could not load the output for this task.';
      }
    );
  }

  downloadOutput(task: any) {
    task.outputError = '';
    this.taskService.getTaskResult(task.user || task.user_id, task.file_id).subscribe(
      (content) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `task-${task.id}-output.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      (error) => {
        console.error('Error downloading task output:', error);
        task.outputError = 'Could not download the output for this task.';
      }
    );
  }
}
