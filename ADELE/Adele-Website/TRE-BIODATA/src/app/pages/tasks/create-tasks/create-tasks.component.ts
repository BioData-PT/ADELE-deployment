import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { TaskService } from '../../../services/task.service';
import { MatTable, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import {MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-tasks',
  imports: [FormsModule, CommonModule, MatToolbarModule, MatButtonModule, MatCardModule, MatInputModule, MatTableModule],
  templateUrl: './create-tasks.component.html',
  styleUrl: './create-tasks.component.scss'
})
export class CreateTasksComponent {

  file_id: string = '';
  pipeline_id: string= '';
  status_message: string = '';
  is_processing:boolean = false;
  output_message: string = '';
  
  user : any;
  user_passports: string[] = [];

  datasets: any[] = [];
  availableFiles: { [dataset_id: string]: any[] } = {};

  selectedDataset: string = '';
  selectedFile: string = '';



  pipelines: any = [];

  constructor(private taskService: TaskService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.user_passports = user.ga4gh_passport_v1 || [];
      this.user_passports.forEach(passport => {
        console.log('Passport:', passport);
        this.getFile(passport);
        this.getPipelines();
      });
    });
  }


getPipelines(){
  this.taskService.getPipelines().subscribe({
    next: (response: any) => {
      console.log('Response:', response);

      if (response.error) {
        return;
      }
      this.pipelines = response.pipelines;
      console.log('Pipelines:', this.pipelines);
    },
    error: (err) => {
      this.status_message = `Failed to retrieve pipelines: ${err.message || 'Unknown error'}`;
    }
  });
}


getFile(passport: string): void {
  this.taskService.getUserFiles(passport).subscribe({
    next: (response: any) => {
      if (response.error) {
        return;
      }

      if (!response.dataset || !Array.isArray(response.files) || response.files.length === 0) {
        return;
      }

      this.availableFiles[response.dataset] = response.files;


      if (!this.datasets.some(ds => ds === response.dataset)) {
        const dataset = { id: response.dataset, name: response.dataset };
        this.datasets.push(dataset);
      }

      console.log('Datasets:', this.datasets);
      console.log('Files:', this.availableFiles);
    },
    error: (err) => {
      this.status_message = `Failed to retrieve files: ${err.message || 'Unknown error'}`;
    }
  });
}
  onDatasetChange() {
    this.selectedFile = '';
    this.file_id = '';
  }

  selectPipeline(pipeline: any) {
    this.pipeline_id = pipeline.id;
  }
  
  selectFile(file: any) {
    this.file_id = file.id;
  }

  submitTask() {
    if (!this.file_id || !this.pipeline_id) {
      this.status_message = 'Please enter both File ID and Pipeline ID.';
      return;
    }

    this.is_processing = true;
    this.status_message = 'Submitting task...';
    
     this.taskService.submitTask(this.file_id, this.pipeline_id).subscribe(
      response => {
        this.pollTaskStatus(response.id);
      },
      error => {
        this.is_processing = false;
        this.status_message = 'Error submitting task.';
      }
    ); 
  }

  pollTaskStatus(taskId: string) {
    this.taskService.pollTaskStatus(taskId).subscribe(
      (response: any) => {
        if (response.state === 'COMPLETE') {
          this.output_message = response.output || 'No output found.';
          this.status_message = response.message;
          console.log(response)
          this.is_processing = false;
        } else if (response.state === 'SYSTEM_ERROR' || response.state === 'EXECUTOR_ERROR') {
          this.status_message = 'Task failed.';
          this.is_processing = false;
        }
      },
      error => {
        this.is_processing = false;
        this.status_message = 'Error fetching task status.';
      }
    );
  }



}
