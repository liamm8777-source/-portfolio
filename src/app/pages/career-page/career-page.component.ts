import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-career-page',
  standalone: true,
  templateUrl: './career-page.component.html',
  styleUrl: './career-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerPageComponent {
  protected readonly contributions: ReadonlyArray<string> = [
    'Delivered production-facing software improvements for Honda mobile applications supporting manufacturing operations.',
    'Helped integrate backend workflows between MPC servers and AI model pipelines for scalable internal tooling.',
    'Performed code review and implementation support focused on reliability, readability, and maintainability.',
    'Presented completed enhancements to technical and business stakeholders for production adoption.',
  ];

  protected readonly strengths: ReadonlyArray<string> = [
    'Production Mindset',
    'AI-Assisted Engineering',
    'Cross-Functional Communication',
    'Code Quality',
    'Problem Solving',
    'Rapid Learning',
  ];
}
