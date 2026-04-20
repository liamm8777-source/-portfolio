import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';

type PromptKey = 'work-experience' | 'future-goals' | 'non-technical-skills';
type ResponseSegmentKind = 'paragraph' | 'bullet';

type PromptAnswer = {
  heading: string;
  paragraphs: ReadonlyArray<string>;
  bullets?: ReadonlyArray<string>;
};

type PromptOption = {
  key: PromptKey;
  category: string;
  question: string;
  preview: string;
  answer: PromptAnswer;
};

@Component({
  selector: 'app-open-chat-page',
  standalone: true,
  templateUrl: './open-chat-page.component.html',
  styleUrl: './open-chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenChatPageComponent implements OnDestroy {
  protected readonly prompts: ReadonlyArray<PromptOption> = [
    {
      key: 'work-experience',
      category: 'Experience',
      question: 'How long has Liam been working in IT?',
      preview: 'A quick summary of hands-on work in production software at Honda.',
      answer: {
        heading: 'Work Experience',
        paragraphs: [
          'Liam has over a year of hands-on experience working in Information Technology at American Honda.',
          'During this time, he has contributed to the development and enhancement of a production-level mobile application built using the Angular framework. His work has focused on improving user experience, optimizing performance, and aligning technical solutions with business needs.',
        ],
      },
    },
    {
      key: 'future-goals',
      category: 'Direction',
      question: "What's next?",
      preview: 'The career direction Liam is currently working toward.',
      answer: {
        heading: 'Future Goals',
        paragraphs: ['Liam is actively pursuing a career in a UI/UX designer role at JP Morgan.'],
      },
    },
    {
      key: 'non-technical-skills',
      category: 'Strengths',
      question: "What are Liam's non-technical skills?",
      preview: 'The people-focused strengths that support technical execution.',
      answer: {
        heading: 'Non-Technical Skills',
        paragraphs: [],
        bullets: [
          'Strong communication skills',
          'Strong problem-solving ability',
          'High level of adaptability in fast-paced environments',
          'Strong attention to detail',
          'Team-oriented mindset with collaborative experience',
          'Self-motivated with a strong work ethic',
        ],
      },
    },
  ];

  protected readonly selectedPromptKey = signal<PromptKey>(this.prompts[0].key);
  protected readonly currentPrompt = computed(() => this.getPromptByKey(this.selectedPromptKey()));
  protected readonly typedParagraphs = signal<ReadonlyArray<string>>([]);
  protected readonly typedBullets = signal<ReadonlyArray<string>>([]);
  protected readonly activeResponseText = signal('');
  protected readonly activeResponseKind = signal<ResponseSegmentKind | null>(null);
  protected readonly isTyping = signal(false);

  private typingTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.startTypingResponse(this.prompts[0]);
  }

  ngOnDestroy(): void {
    this.clearTypingTimeout();
  }

  protected selectPrompt(promptKey: PromptKey): void {
    this.selectedPromptKey.set(promptKey);
    this.startTypingResponse(this.getPromptByKey(promptKey));
  }

  private getPromptByKey(promptKey: PromptKey): PromptOption {
    return this.prompts.find((prompt) => prompt.key === promptKey) ?? this.prompts[0];
  }

  private startTypingResponse(prompt: PromptOption): void {
    this.clearTypingTimeout();
    this.typedParagraphs.set([]);
    this.typedBullets.set([]);
    this.activeResponseText.set('');
    this.activeResponseKind.set(null);

    const segments = [
      ...prompt.answer.paragraphs.map((text) => ({ kind: 'paragraph' as const, text })),
      ...(prompt.answer.bullets ?? []).map((text) => ({ kind: 'bullet' as const, text })),
    ];

    if (!segments.length) {
      this.isTyping.set(false);
      return;
    }

    this.isTyping.set(true);
    this.typeSegment(segments, 0);
  }

  private typeSegment(
    segments: ReadonlyArray<{ kind: ResponseSegmentKind; text: string }>,
    segmentIndex: number,
  ): void {
    if (segmentIndex >= segments.length) {
      this.activeResponseText.set('');
      this.activeResponseKind.set(null);
      this.isTyping.set(false);
      return;
    }

    const segment = segments[segmentIndex];
    const charsPerTick = segment.text.length > 200 ? 4 : segment.text.length > 100 ? 3 : 2;
    let charIndex = 0;

    this.activeResponseKind.set(segment.kind);
    this.activeResponseText.set('');

    const advance = () => {
      charIndex = Math.min(charIndex + charsPerTick, segment.text.length);
      this.activeResponseText.set(segment.text.slice(0, charIndex));

      if (charIndex < segment.text.length) {
        this.typingTimeout = setTimeout(advance, 18);
        return;
      }

      if (segment.kind === 'paragraph') {
        this.typedParagraphs.update((paragraphs) => [...paragraphs, segment.text]);
      } else {
        this.typedBullets.update((bullets) => [...bullets, segment.text]);
      }

      this.activeResponseText.set('');
      this.activeResponseKind.set(null);
      this.typingTimeout = setTimeout(() => this.typeSegment(segments, segmentIndex + 1), 140);
    };

    advance();
  }

  private clearTypingTimeout(): void {
    if (!this.typingTimeout) {
      return;
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = undefined;
  }
}
