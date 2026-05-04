import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { PipelinesComponent } from './pages/pipelines/pipelines.component';
import { ProjectDetailsComponent } from './pages/project-details/project-details.component';
import { LegalDocumentsManageComponent } from './pages/legal-documents-manage/legal-documents-manage.component';
import { TasksValidationComponent } from './pages/tasks-validation/tasks-validation.component';
import { DisplayQueueFilesComponent } from './pages/display-queue-files/display-queue-files.component';
import { AuthGuard } from './services/auth.guard';
import { LoginComponent } from './pages/login/login.component';


export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', canActivate: [AuthGuard], children: [
        { path: '', component: DashboardComponent },
        { path: 'projects', component: ProjectsComponent },
        { path: 'projects/:id', component: ProjectDetailsComponent },
        { path: 'pipelines', component: PipelinesComponent },
        { path: 'legal_documents', component: LegalDocumentsManageComponent },
        { path: 'tasks', component: TasksValidationComponent },
        { path: 'display-queue-files', component: DisplayQueueFilesComponent },
      ]},
    { path: '**', redirectTo: '' }
  ];