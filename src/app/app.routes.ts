import { Routes } from '@angular/router';
import { CareerPageComponent } from './pages/career-page/career-page.component';
import { EducationPageComponent } from './pages/education-page/education-page.component';
import { HobbiesPageComponent } from './pages/hobbies-page/hobbies-page.component';
import { OpenChatPageComponent } from './pages/open-chat-page/open-chat-page.component';
import { SkillsPageComponent } from './pages/skills-page/skills-page.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'career' },
	{ path: 'career', component: CareerPageComponent },
	{ path: 'education', component: EducationPageComponent },
	{ path: 'hobbies', component: HobbiesPageComponent },
	{ path: 'skills', component: SkillsPageComponent },
	{ path: 'open-chat', component: OpenChatPageComponent },
	{ path: '**', redirectTo: 'career' },
];
