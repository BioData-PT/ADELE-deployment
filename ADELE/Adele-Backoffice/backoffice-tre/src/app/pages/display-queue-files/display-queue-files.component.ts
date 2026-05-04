import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FileManagementService } from '../../services/file-management.service';
import { CommonModule } from '@angular/common';
import { Form, FormGroup, FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-display-queue-files',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './display-queue-files.component.html',
  styleUrl: './display-queue-files.component.scss'
})
export class DisplayQueueFilesComponent {

  openModal = false;

  files: any; 
  fileForm: FormGroup = new FormGroup({
    filename: new FormControl(''),
    unique_id: new FormControl(''),
    dataset_id: new FormControl(''),
    rems_item_name: new FormControl(''),
  });

  constructor(private authService: AuthService, private fileManagementService: FileManagementService) {
  }

  ngOnInit() {
    const role = this.authService.getRole();
    console.log('User role:', role);

    this.fileManagementService.getQueueFiles().subscribe(
        (res: any) => {
          console.log('Response from getQueueFiles:', res);
          if (res.success) {
            // Assuming the output is a comma-separated string of file names
            console.log('Files retrieved from the queue:', res.output);
            this.files = res.output;
            console.log('Processed files:', this.files);
          } else {
            console.error('Failed to retrieve files from the queue:', res);
            this.files = [];
          }
        },
        (error: any) => {
          console.error('Error retrieving files from the queue:', error);
          this.files = [];
        }
      ); 
  }

  openFileModal(filename: string) {
    console.log('Opening modal for file:', filename);
    this.openModal = true;
    this.fileForm.patchValue({
      filename: filename,
      unique_id: '',
      dataset_id: '',
      rems_item_name: ''
    });
  }

  closeFileModal() {
    this.openModal = false;
    this.fileForm.reset();
  }

  processFile() {
    console.log('Processing file with form data:', this.fileForm.value);
    const formData = this.fileForm.value;
    this.fileManagementService.processFile(formData).subscribe(
      (res: any) => {
        console.log('Response from processFile:', res);
        if (res.success) {
          console.log(`File ${formData.filename} processed successfully.`);
          this.refreshFiles(); // Refresh the file list after processing
        } else {
          console.error(`Failed to process file ${formData.filename}:`, res);
        }
      },
      (error: any) => {
        console.error(`Error processing file ${formData.filename}:`, error);
      }
    );
  }


refreshFiles() {
  this.ngOnInit();
  console.log('Files refreshed:', this.files);
}

}