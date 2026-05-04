import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tasks-validation',
  imports: [CommonModule],
  templateUrl: './tasks-validation.component.html',
  styleUrl: './tasks-validation.component.scss'
})
export class TasksValidationComponent implements OnInit {

  files: string[] = [];
  selectedUser: string | null = null;
  selectedFile: string | null = null;
  fileBlob: Blob | null = null;
  loading: boolean = false;
  error: string = '';
  fileContent: string | null = null;

  constructor(private taskService: TaskService) { }

  ngOnInit(): void {
    this.fetchFiles();
  }

  fetchFiles() {
    this.loading = true;
    this.taskService.getOutputList().subscribe({
      next: (res) => {
        console.log('Files fetched:', res);
        this.files = res.files;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load files for validation.';
        this.loading = false;
      }
    });
  }

previewFile(user: string, filename: string) {
    this.loading = true;
    this.selectedUser = user;
    this.selectedFile = filename;
    this.fileContent = null;

    this.taskService.viewUserFile(user, filename).subscribe({
      next: (response:any) => {
        this.fileContent = response.content;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load file content.';
        this.loading = false;
      }
    });
}

  approve(user: string, filename: string) {
    this.loading = true;
    this.taskService.approveFile(user, filename).subscribe({
      next: () => {
        this.fetchFiles();
        this.selectedFile = null;
        this.fileBlob = null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to approve file.';
        this.loading = false;
      }
    });
  }

  reject(user: string, filename: string) {
    this.loading = true;
    this.taskService.rejectFile(user, filename).subscribe({
      next: () => {
        this.fetchFiles();
        this.selectedFile = null;
        this.fileBlob = null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to reject file.';
        this.loading = false;
      }
    });
  }
}
