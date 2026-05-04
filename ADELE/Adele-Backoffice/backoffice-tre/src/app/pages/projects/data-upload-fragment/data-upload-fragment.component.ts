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

  fileForm = new FormGroup({
    filename: new FormControl(''),
    unique_id_suffix: new FormControl('', [Validators.required]),
    dataset_id_suffix: new FormControl('', [Validators.required]),
    rems_catalogue_id: new FormControl('')
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

    this.fileManagementService.processFile(formData).subscribe(
      (res: any) => {
        console.log('Response from processFile:', res);
        if (res.success) {
          console.log(`File ${this.fileForm.value.filename} processed successfully.`);
          // remove the extension from filename
          const filename = this.fileForm.value.filename || '';
          const filenameWithoutExtension = filename.replace(/\.[^/.]+$/, "");
          console.log(`Filename without extension: ${filenameWithoutExtension}`);
          this.fileManagementService.fileIngested(this.selectedFileId).subscribe(
            (res: any) => {
              console.log(`File ingested successfully: ${res}`);
            },
            (error: any) => {
              console.error(`Error ingesting file: ${error}`);
            }
          );
          this.resetSelectedFile();
        } else {
          console.error(`Failed to process file ${this.fileForm.value.filename}:`, res);
        }
      },
      (error: any) => {
        console.error(`Error processing file ${this.fileForm.value.filename}:`, error);
      }
    );
  }

  showFileForm(file: any) {
    const projectNameSlug = (this.project.title || '').toLowerCase().replace(/\s+/g, '_');
    const datasetTitleSlug = "dataset_title_example"
    const distributionTitleSlug = "distribution_title_example"

    const dataset_id_suffix = `${projectNameSlug}:${datasetTitleSlug}`;
    const unique_id_suffix = `${projectNameSlug}:${datasetTitleSlug}:${distributionTitleSlug}`;

    this.selectedFile = file.filename;
    this.selectedFileId = file.file_id;
    this.fileForm.patchValue({
      filename: file.file_id + '.c4gh',
      unique_id_suffix: unique_id_suffix,
      dataset_id_suffix: dataset_id_suffix,
      rems_catalogue_id: file.rems_catalogue_id || ''
    });
  }

  submitFileForm() {
    if (this.fileForm.valid) {
      this.ingestFile();
    }
  }

  resetSelectedFile(){
    this.selectedFile = '';
    this.selectedFileId = '';
    this.fileForm.reset();
  }

}
