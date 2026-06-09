import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FileManagementService } from '../../../services/file-management.service';

@Component({
  selector: 'app-data-upload-fragment',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './data-upload-fragment.component.html',
  styleUrls: ['./data-upload-fragment.component.scss']
})
export class DataUploadFragmentComponent {
  @Input() project: any;

  files: any[] = [];

  uniqueIdPrefix = 'pt:inesc-id.pt:tre:adele:';
  datasetIdPrefix = 'pt:inesc-id.pt:tre:adele:dataset:';

  selectedFile = '';
  selectedFileId=  '';

  // Ingest submission state, surfaced in the modal so the admin gets feedback.
  isSubmitting = false;
  statusMessage = '';
  statusType: 'success' | 'error' | '' = '';

  fileForm = new FormGroup({
    filename: new FormControl(''),
    unique_id_suffix: new FormControl('', [Validators.required]),
    dataset_id_suffix: new FormControl('', [Validators.required]),
    rems_catalogue_id: new FormControl('', [Validators.required])
  });

  constructor(private fileManagementService: FileManagementService) { }

  ngOnInit(): void {
    console.log("DataUploadFragmentComponent initialized");
    console.log("Project data:", this.project);
    this.fileManagementService.getProjectFiles(this.project.id).subscribe({
      next: (response: any) => {
        this.files = response.files;
        console.log("Project files:", this.files);
      },
      error: (error: any) => {
        console.error("Error fetching project files:", error);
      }
    });
  }

  ingestFile() {
    console.log('Processing file with form data:', this.fileForm.value);

    const formData = new FormData();
    formData.append('filename', this.fileForm.value.filename || '');
    formData.append('unique_id', this.uniqueIdPrefix + (this.fileForm.value.unique_id_suffix || ''));
    formData.append('dataset_id', this.datasetIdPrefix + (this.fileForm.value.dataset_id_suffix || ''));
    formData.append('rems_catalogue_id', this.fileForm.value.rems_catalogue_id || '');

    this.isSubmitting = true;
    this.statusType = '';
    this.statusMessage = 'Ingesting file… this can take a couple of minutes.';

    this.fileManagementService.processFile(formData).subscribe(
      (res: any) => {
        // A 2xx response means the SDA pipeline + REMS update succeeded.
        console.log('Response from processFile:', res);
        this.statusType = 'success';
        this.statusMessage = (res && res.message) || 'File ingested successfully.';

        // Mark the file as ingested in the project DB; non-fatal if it fails.
        this.fileManagementService.fileIngested(this.selectedFileId).subscribe({
          next: () => console.log('File status updated to ingested.'),
          error: (error: any) => console.error('Error updating file status:', error)
        });

        this.isSubmitting = false;
        // Refresh the file list so the ingested file reflects its new state.
        this.refreshFiles();
      },
      (error: any) => {
        console.error(`Error processing file ${this.fileForm.value.filename}:`, error);
        this.isSubmitting = false;
        this.statusType = 'error';
        this.statusMessage =
          (error && error.error && error.error.error) ||
          'File ingestion failed. Please try again.';
      }
    );
  }

  refreshFiles() {
    this.fileManagementService.getProjectFiles(this.project.id).subscribe({
      next: (response: any) => { this.files = response.files; },
      error: (error: any) => console.error('Error refreshing project files:', error)
    });
  }

  showFileForm(file: any) {
    const projectNameSlug = (this.project.title || '').toLowerCase().replace(/\s+/g, '_');
    const datasetTitleSlug = "dataset_title_example"
    const distributionTitleSlug = "distribution_title_example"

    const dataset_id_suffix = `${projectNameSlug}:${datasetTitleSlug}`;
    const unique_id_suffix = `${projectNameSlug}:${datasetTitleSlug}:${distributionTitleSlug}`;

    this.selectedFile = file.filename;
    this.selectedFileId = file.file_id;
    this.statusMessage = '';
    this.statusType = '';
    this.isSubmitting = false;
    this.fileForm.patchValue({
      filename: file.file_id + '.c4gh',
      unique_id_suffix: unique_id_suffix,
      dataset_id_suffix: dataset_id_suffix,
      rems_catalogue_id: file.rems_catalogue_id || ''
    });
  }

  submitFileForm() {
    if (this.isSubmitting) {
      return;
    }
    if (this.fileForm.invalid) {
      this.fileForm.markAllAsTouched();
      this.statusType = 'error';
      this.statusMessage = 'Please fill in all required fields before submitting.';
      return;
    }
    this.ingestFile();
  }

  resetSelectedFile(){
    this.selectedFile = '';
    this.selectedFileId = '';
    this.fileForm.reset();
  }

}
