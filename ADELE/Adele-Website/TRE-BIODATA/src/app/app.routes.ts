import { Routes } from '@angular/router';
import { MetadataComponent } from './pages/metadata/metadata.component';
import { HomeComponent } from './pages/home/home.component';
import { CallbackComponent } from './pages/callback/callback.component';
import { MetadataFormComponent } from './pages/metadata/metadata-form/metadata-form.component';
import { ProjectDisplayComponent } from './pages/project-display/project-display.component';
import { ProjectDetailsComponent } from './pages/project-display/project-details/project-details.component';
import { UnsavedChangesGuard } from './guards/unsaved-changes.guard';
import { DataUploadComponent } from './pages/data-upload/data-upload.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { TutorialComponent } from './pages/tutorial/tutorial.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import { CreateTasksComponent } from './pages/tasks/create-tasks/create-tasks.component';

export const routes: Routes = [
        { path: '', component: HomeComponent, title: 'Home' },
        { path: 'home', component: HomeComponent, title: 'Home' },
        { path: 'metadata-details', component: MetadataComponent, title: 'Metadata Details'},
        { path: 'metadata-details/new-form',  component:MetadataFormComponent, title: 'Metadata Form', canDeactivate: [UnsavedChangesGuard]},
        { path: 'oidc-callback', component: CallbackComponent },
        { path: 'projects', component: ProjectDisplayComponent, title: 'Projects' },
        { path: 'projects/:id', component: ProjectDetailsComponent, title: 'Project Details', canDeactivate: [UnsavedChangesGuard] },
        { path: 'projects/new', component: ProjectDetailsComponent, title: 'Project Details', canDeactivate: [UnsavedChangesGuard] },
        { path: 'data-upload', component: DataUploadComponent, title: 'Data Upload' },
        { path: 'tasks', component: TasksComponent, title: 'Tasks'        },
        { path: 'tasks/new', component: CreateTasksComponent, title: 'Create Task' },
        { path: 'about', component: AboutUsComponent, title: 'About ADELE' },
        { path: 'tutorials', component: TutorialComponent, title: 'Tutorials' },
        { path: '**', redirectTo: '/home' }

];

export default routes;
