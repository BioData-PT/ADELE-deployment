import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CodeDisplayComponent } from '../../components/code-display/code-display.component';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RemsService } from '../../services/rems.service';
import { FileUploadService } from '../../services/file-upload.service';

@Component({
  selector: 'app-data-upload',
  imports: [MatCardModule, MatIconModule, CodeDisplayComponent, MatDividerModule, CommonModule, MatFormFieldModule, ReactiveFormsModule, FormsModule],
  templateUrl: './data-upload.component.html',
  styleUrl: './data-upload.component.scss'
})
export class DataUploadComponent {
  @Input() projectId: string = '';

  selectedFile: File | null = null;
  dragActive: boolean = false;
  error_message: string = '';

  uploadedFiles: any[] = [];

  checksumLine = 'Loading…';
  downloading = false;

  constructor(private fileUploadService: FileUploadService) { }

  ngOnInit() {
    console.log('Data Upload Component initialized.');
    this.fileUploadService.getChecksum$().subscribe({
      next: (checksum) => {
        this.checksumLine = checksum;
        this.getUploadedFilesList();
      },
      error: () => {
        this.checksumLine = 'Failed to load checksum.';
      }
    });
    
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile = file;
    }
  }

  downloadPKFile(): void {
    this.downloading = true;
    this.fileUploadService.downloadPublicKey$().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TRE.pub';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: () => {
        alert('Failed to download public key.');
        this.downloading = false;
      }
    });
  }


  getUploadedFilesList(){
    this.fileUploadService.getFilesUploaded(this.projectId).subscribe({
      next: (response: any) => {
        this.uploadedFiles = response.files;
        console.log('Uploaded files:', this.uploadedFiles);
      },
      error: () => {
        alert('Failed to retrieve uploaded files.');
      }
    });
  }

  isValidFile(): boolean {
    if (!this.selectedFile) return false;
    if (this.selectedFile.size > 2 * 1024 * 1024 * 1024) {
      this.error_message = 'File size exceeds 2GB limit.';
      return false;
    }
    // TODO: allow only .c4gh files
    if (!this.selectedFile.name.endsWith('.c4gh')) {
      this.error_message = 'Invalid file type. Please upload a .c4gh file.';
      return false;
    }
    return true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    if (!this.isValidFile()) {
      alert(this.error_message);
      return;
    }
    this.fileUploadService.uploadFile(this.selectedFile, this.projectId).subscribe({
      next: (response) => {
        alert('File uploaded successfully!');
        this.selectedFile = null;
      },
      error: (error) => {
        alert('File upload failed.');
      }
    });
  }

}
