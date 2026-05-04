import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TextFieldModule } from '@angular/cdk/text-field';


@Component({
  selector: 'app-pipeline-details-modal',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, TextFieldModule],
  templateUrl: './pipeline-details-modal.component.html',
  styleUrls: ['./pipeline-details-modal.component.scss']
})
export class PipelineDetailsModalComponent {
  pipeline: any = {};
  isNewPipeline: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PipelineDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.pipeline = data.pipeline || {};
    this.isNewPipeline = data.isNewPipeline || false;

    if (typeof this.pipeline.payload === 'string') {
    try {
      const parsed = JSON.parse(this.pipeline.payload);
      this.pipeline.payload = JSON.stringify(parsed, null, 2);
    } catch (e) {
      console.warn('Invalid JSON payload, keeping original string');
    }
  }
  
  }

  savePipeline() {
    this.pipeline.payload = JSON.parse(this.pipeline.payload);
    this.dialogRef.close(this.pipeline);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}