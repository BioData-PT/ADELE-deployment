import { Component, Input, OnInit } from '@angular/core';
import { FileService } from '../../services/file.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import { GSSAPICanonicalizationValue, StrictMatchKeysAndValues } from 'mongodb';
import { ProjectsService } from '../../services/projects.service';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-file-management',
  imports: [CommonModule, MatIconModule, MatCardModule],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css'],
})
export class FileManagementComponent implements OnInit {
  @Input() project_id = '';
  @Input() status = '';


  files: any;
  selectedFile: File | null = null;
  user_id: string = '';
  //project_id: string = '';

  selectedFiles: Map<string, File> = new Map(); 

  fileList = [];

  constructor(
    private fileService: FileService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private projectService: ProjectsService
  ) {
    // check if the user is logged in
    authService.user$.subscribe((user) => {
      this.user_id = user?.sub;
      if (!user) {
        authService.login();
      }
    });
  }

  ngOnInit() {
    console.log('Project ID: ', this.project_id);
    console.log("Status: " + this.status);

    if (this.status == 'A-E') {
      // Fetching files to sign
      this.projectService.getProject(this.project_id).subscribe({
        next: (res:any) => {
          console.log('Project Details: ', res);
          this.files = res.templateFiles;
        },
        error: (err) => {
          console.error('Error fetching project details: ', err);
          alert('Error fetching project details. Please try again later.');
        },
      });
        } else if (this.status == 'A-AR') {
      // Fetching files submitted for approval
      this.projectService.getProject(this.project_id).subscribe({
        next: (res:any) => {
          this.files = res.userSignedFiles;
          console.log('Project Details: ', this.files);
        },
        error: (err) => {
          console.error('Error fetching project details: ', err);
          alert('Error fetching project details. Please try again later.');
        },
      });
    }
  }

  downloadFile(filename: string) {
    this.fileService.downloadTemplateFile(filename, this.project_id).subscribe({
      next: (blob: Blob) => {
        const uri = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = uri;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error downloading file: ', err);
        alert('Error downloading file. Please try again later.');
      },
    });
  }

  getSignedDownloadUri(filename: string) {
    this.fileService.getSignedDownloadUri(filename, this.project_id).subscribe({
      next: (blob: Blob) => {
        const uri = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = uri;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error getting signed download URI: ', err);
        alert('Error getting download link. Please try again later.');
      }
    });
  }

  uploadFiles() {
    if (this.selectedFiles.size === 0) {
      alert('Please select files to upload.');
      return;
    }

    this.selectedFiles.forEach((file, filename) => {
      this.fileService.uploadFile(file, this.project_id).subscribe({
        next: (res) => {
          console.log('File uploaded successfully: ', res);
          alert(`File ${filename} uploaded successfully.`);
          // Optionally, refresh the file list or perform other actions
        },
        error: (err) => {
          console.error('Error uploading file: ', err);
          alert(`Error uploading file ${filename}. Please try again later.`);
        },
      });
    });

    // Clear selected files after upload
    this.selectedFiles.clear();
  }

  onFileSelect(event: any, filename: string) {
    const file = event.target.files[0];
    if (!file) return;

    const renamedFile = new File([file], filename, {
      type: file.type,
      lastModified: file.lastModified,
    });

    this.selectedFiles.set(renamedFile.name, renamedFile);
    console.log(`File selected: ${renamedFile.name}`, renamedFile);
  }


}
