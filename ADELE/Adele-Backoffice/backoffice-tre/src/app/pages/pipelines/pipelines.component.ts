import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PipelineService } from '../../services/pipeline.service';
import { MatDialog } from '@angular/material/dialog';
import { PipelineDetailsModalComponent } from '../../pipeline-details-modal/pipeline-details-modal.component';

@Component({
  selector: 'app-pipelines',
  imports: [CommonModule, MatTableModule],
  templateUrl: './pipelines.component.html',
  styleUrl: './pipelines.component.scss'
})
export class PipelinesComponent {
  pipelines: any = [];
  displayedColumns: string[] = ['name', 'description', 'actions'];

  constructor(private pipelineService: PipelineService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadPipelines();
  }

  loadPipelines() {
    this.pipelineService.getPipelines().subscribe(
      (data) => {
          this.pipelines = data as any[];
          console.log('Pipelines loaded:', this.pipelines);
          this.pipelines.forEach((pipeline: any) => {
            const payload = JSON.parse(pipeline.payload);
            pipeline.name = payload.name;
            pipeline.description = payload.description;
          });

        },
      (error) => {
        console.error('Error loading pipelines:', error);
      }
    );
  }



openPipeline(pipeline: any) {
  const dialogRef = this.dialog.open(PipelineDetailsModalComponent, {
    width: '1000px',
    data: { pipeline, isNewPipeline: false }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.pipelineService.updatePipeline(pipeline.id, result).subscribe(
        (data) => {
          console.log('Pipeline updated:', data);
          this.loadPipelines();
        },
        (error) => {
          console.error('Error updating pipeline:', error);
        }
      );
    }
  });
}

deletePipeline(pipeline: any) {
  const confirmDelete = confirm('Are you sure you want to delete this pipeline?');
  if (confirmDelete) {
    this.pipelineService.deletePipeline(pipeline.id).subscribe(
      () => {
        console.log('Pipeline deleted:', pipeline.id);
        this.loadPipelines();
      },
      (error) => {
        console.error('Error deleting pipeline:', error);
      }
    );
  }
}

createPipeline() {
  const dialogRef = this.dialog.open(PipelineDetailsModalComponent, {
    width: '1000px',
    data: { isNewPipeline: true }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      console.log('New Pipeline:', result);
      this.pipelineService.createPipeline(result).subscribe(
        (data) => {
          console.log('Pipeline created:', data);
          this.loadPipelines();
        },
        (error) => {
          console.error('Error creating pipeline:', error);
        }
      );
    }
  });
}

}
