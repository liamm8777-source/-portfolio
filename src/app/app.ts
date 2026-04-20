import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

type PromptKey = 'professional-experience' | 'software-production' | 'my-future-projects';
type InfoSectionKey = 'career' | 'skills' | 'education' | 'chat';
type ScoreSide = 'left' | 'right';
type AuthStage =
  | 'unauthorized'
  | 'login'
  | 'visitor-authorized'
  | 'validating-status'
  | 'welcome'
  | 'granted';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('pongCanvas')
  private set pongCanvasRef(value: ElementRef<HTMLCanvasElement> | undefined) {
    this._pongCanvasRef = value;

    if (
      value &&
      !this.isEducationRoute() &&
      !this.isHobbiesRoute() &&
      !this.isSkillsRoute() &&
      !this.isOpenChatRoute() &&
      !this.animationFrameId
    ) {
      this.initializePong();
    }
  }
  @ViewChild('promptContentCard') private promptContentCardRef?: ElementRef<HTMLElement>;

  protected readonly selectedPrompt = signal<PromptKey>('professional-experience');
  protected readonly typedPromptText = signal('');
  protected readonly promptContentMinHeight = signal<number | null>(null);
  protected readonly chatCollapsed = signal(false);
  protected readonly authStage = signal<AuthStage>('unauthorized');
  protected readonly isEducationRoute = signal(false);
  protected readonly isHobbiesRoute = signal(false);
  protected readonly isSkillsRoute = signal(false);
  protected readonly isOpenChatRoute = signal(false);
  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly infoSectionOrder = signal<ReadonlyArray<InfoSectionKey>>([
    'career',
    'skills',
    'education',
    'chat',
  ]);
  protected readonly draggingSection = signal<InfoSectionKey | null>(null);

  protected readonly technicalSkillGroups: ReadonlyArray<{ title: string; skills: ReadonlyArray<string> }> = [
    {
      title: 'Programming & Web Development',
      skills: ['Python', 'Java', 'JavaScript', 'Angular', 'React', 'HTML', 'CSS'],
    },
    {
      title: 'Systems & Infrastructure',
      skills: ['Database Fundamentals', 'Networking Principles', 'AWS Cloud', 'Windows and macOS'],
    },
    {
      title: 'Engineering Practices',
      skills: [
        'Debugging Code',
        'Troubleshooting',
        'Managing Repositories',
        'Systems Implementation',
        'OSI Model',
        'Agile Development',
      ],
    },
  ];

  private readonly promptContent: Record<PromptKey, { heading: string; body: string }> = {
    'professional-experience': {
      heading: 'Professional Experience & Technical Contributions',
      body:
        'I contributed to the design and development of advanced artificial intelligence models and production-ready software solutions for Honda mobile applications. My work focused on building and integrating backend connections between MPC servers and multiple AI models, enabling collaborative and scalable AI workflows across systems.\n\n' +
        'I collaborated with experienced developers in a fast-paced environment, supporting architecture decisions, problem-solving strategies, and day-to-day implementation work. This role demanded critical thinking, rapid adaptation to changing requirements, and a consistent focus on delivering secure, reliable, and maintainable code.\n\n' +
        'In addition to development responsibilities, I served as a dedicated code reviewer, helping maintain quality standards and consistency across projects while providing technical feedback to improve readability, performance, and long-term maintainability.\n\n' +
        'I also created and implemented a structured Markdown-based workflow for communicating with AI systems in a format aligned to large language model context processing. This framework was adopted internally and is actively used by developers at Honda to improve AI collaboration, prompt structure, and delivery efficiency.\n\n' +
        'Production Mobile Application Enhancements for Manufacturing Operations\n\n' +
        'I proposed and delivered more than ten high-impact product and technical improvements for one of Honda’s largest mobile applications used directly on the production floor. Each recommendation was formally reviewed by business and technical stakeholders, approved, and is now fully implemented in the live production environment. I independently analyzed the existing codebase, implemented the enhancements, validated their functionality, and presented completed solutions to the business team for final adoption. These contributions improved application usability, performance, and operational efficiency for frontline manufacturing users while aligning with enterprise standards for reliability, security, and production quality.',
    },
    'software-production': {
      heading: 'Software Developed by Me in Production',
      body:
        'I proposed and delivered more than ten high-impact product and technical improvements for one of Honda’s largest mobile applications used directly on the production floor.\n\n' +
        'Each recommendation was formally reviewed by business and technical stakeholders, approved, and is now fully implemented in the live production environment. I independently analyzed the existing codebase, implemented the enhancements, validated their functionality, and presented completed solutions to the business team for final adoption.\n\n' +
        'These contributions improved application usability, performance, and operational efficiency for frontline manufacturing users while ensuring alignment with production standards, reliability requirements, and enterprise development practices.',
    },
    'my-future-projects': {
      heading: 'My Future Projects',
      body:
        'I plan to design and build my own local AI coding models that run entirely on my own hardware, without relying on cloud-based inference. The long-term goal is to create a continuously running development assistant that operates 24/7 and improves over time through structured training workflows.\n\n' +
        'My approach will involve leveraging advanced external models as teachers to help train and refine my local model’s coding capabilities. By using this model-to-model training strategy, I aim to accelerate learning, improve code quality, and enable the system to adapt quickly to new programming patterns, tools, and best practices.\n\n' +
        'This project will focus on building an efficient local training pipeline, automated evaluation and feedback loops, and practical integrations that allow the model to assist with real-world development tasks such as code generation, refactoring, documentation, and testing.\n\n' +
        'While the full technical architecture is still evolving, this initiative represents a long-term research and engineering effort that I am actively planning and excited to pursue as part of my continued growth in AI and software development.',
    },
  };

  protected readonly currentPrompt = computed(() => this.promptContent[this.selectedPrompt()]);
  private typingInterval?: ReturnType<typeof setInterval>;
  private authTimeoutId?: ReturnType<typeof setTimeout>;
  private usernameInterval?: ReturnType<typeof setInterval>;
  private passwordInterval?: ReturnType<typeof setInterval>;
  private readonly loginStageDuration = 4320;
  private animationFrameId?: number;
  private resizeHandler = () => this.resizeCanvas();
  private pongCtx?: CanvasRenderingContext2D;
  private _pongCanvasRef?: ElementRef<HTMLCanvasElement>;
  private canvasWidth = 0;
  private canvasHeight = 0;

  private ballX = 0;
  private ballY = 0;
  private ballVX = 2.2;
  private ballVY = 1.8;
  private readonly ballSize = 18;

  private readonly paddleWidth = 14;
  private readonly paddleHeight = 140;
  private leftPaddleY = 0;
  private rightPaddleY = 0;
  private readonly paddleSpeed = 2.7;
  private leftScore = 0;
  private rightScore = 0;
  private leftMissFrames = 0;
  private rightMissFrames = 0;
  private readonly forcedScoreIntervalMs = 95_000;
  private nextForcedScoreAt = 0;
  private lastScoreSide: ScoreSide | null = null;
  private lastScoreTime = 0;
  private readonly particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
  }> = [];
  private audioContext?: AudioContext;
  private routeSubscription?: Subscription;

  constructor(private readonly router: Router) {
    this.nextForcedScoreAt = performance.now() + 45_000;
    this.handleRouteChange(this.router.url);
    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.handleRouteChange(event.urlAfterRedirects);
      }
    });
    this.startTyping('professional-experience');
    this.beginAuthSequence();
  }

  ngAfterViewInit(): void {
    this.initializePong();
  }

  protected selectPrompt(prompt: PromptKey): void {
    this.capturePromptContentHeight();
    this.selectedPrompt.set(prompt);
    this.startTyping(prompt);
  }

  protected toggleChatCollapsed(): void {
    this.chatCollapsed.update((value) => !value);
  }

  protected onSectionDragStart(event: DragEvent, section: InfoSectionKey): void {
    if (!event.dataTransfer) {
      return;
    }

    this.draggingSection.set(section);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', section);
  }

  protected onSectionDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  protected onSectionDrop(event: DragEvent, dropTarget: InfoSectionKey): void {
    event.preventDefault();
    const dragSource = this.draggingSection() ??
      (event.dataTransfer?.getData('text/plain') as InfoSectionKey | '');

    if (!dragSource || dragSource === dropTarget) {
      return;
    }

    const currentOrder = [...this.infoSectionOrder()];
    const sourceIndex = currentOrder.indexOf(dragSource);
    const targetIndex = currentOrder.indexOf(dropTarget);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    [currentOrder[sourceIndex], currentOrder[targetIndex]] = [
      currentOrder[targetIndex],
      currentOrder[sourceIndex],
    ];

    this.infoSectionOrder.set(currentOrder);
    this.draggingSection.set(null);
  }

  protected onSectionDragEnd(): void {
    this.draggingSection.set(null);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.clearTypingInterval();
    this.clearAuthTimeout();
    this.clearAuthIntervals();
    this.stopPong();
  }

  private handleRouteChange(url: string): void {
    const isEducation = url.startsWith('/education');
    const isHobbies = url.startsWith('/hobbies');
    const isSkills = url.startsWith('/skills');
    const isOpenChat = url.startsWith('/open-chat') || url.startsWith('/ai-briefing');
    this.isEducationRoute.set(isEducation);
    this.isHobbiesRoute.set(isHobbies);
    this.isSkillsRoute.set(isSkills);
    this.isOpenChatRoute.set(isOpenChat);

    if (isEducation || isHobbies || isSkills || isOpenChat) {
      this.stopPong();
      return;
    }

    if (!this.animationFrameId && this._pongCanvasRef?.nativeElement) {
      this.initializePong();
    }
  }

  private startTyping(prompt: PromptKey): void {
    this.clearTypingInterval();
    const fullText = this.promptContent[prompt].body;
    this.typedPromptText.set('');
    this.capturePromptContentHeight();

    let index = 0;
    const charsPerTick =
      fullText.length > 1800 ? 6 : fullText.length > 1100 ? 4 : 2;

    this.typingInterval = setInterval(() => {
      index = Math.min(index + charsPerTick, fullText.length);
      this.typedPromptText.set(fullText.slice(0, index));
      this.capturePromptContentHeight();

      if (index >= fullText.length) {
        this.capturePromptContentHeight();
        this.clearTypingInterval();
      }
    }, 16);
  }

  private capturePromptContentHeight(): void {
    const card = this.promptContentCardRef?.nativeElement;
    if (!card) {
      return;
    }

    const measuredHeight = Math.ceil(card.getBoundingClientRect().height);
    if (!measuredHeight) {
      return;
    }

    const currentMinHeight = this.promptContentMinHeight() ?? 0;
    if (measuredHeight > currentMinHeight) {
      this.promptContentMinHeight.set(measuredHeight);
    }
  }

  private clearTypingInterval(): void {
    if (!this.typingInterval) {
      return;
    }

    clearInterval(this.typingInterval);
    this.typingInterval = undefined;
  }

  private beginAuthSequence(): void {
    this.clearAuthTimeout();
    this.clearAuthIntervals();
    this.username.set('');
    this.password.set('');
    this.authStage.set('unauthorized');

    this.authTimeoutId = setTimeout(() => {
      this.authStage.set('login');
      this.startAutoCredentials();
    }, 1800);
  }

  private clearAuthTimeout(): void {
    if (!this.authTimeoutId) {
      return;
    }

    clearTimeout(this.authTimeoutId);
    this.authTimeoutId = undefined;
  }

  private startAutoCredentials(): void {
    const autoUsername = 'Evangelion';
    const autoPassword = 'portfolio';

    this.username.set('');
    this.password.set('');

    let usernameIndex = 0;
    this.usernameInterval = setInterval(() => {
      usernameIndex += 1;
      this.username.set(autoUsername.slice(0, usernameIndex));

      if (usernameIndex >= autoUsername.length) {
        if (this.usernameInterval) {
          clearInterval(this.usernameInterval);
          this.usernameInterval = undefined;
        }

        this.authTimeoutId = setTimeout(() => {
          let passwordIndex = 0;
          this.passwordInterval = setInterval(() => {
            passwordIndex += 1;
            this.password.set(autoPassword.slice(0, passwordIndex));

            if (passwordIndex >= autoPassword.length) {
              if (this.passwordInterval) {
                clearInterval(this.passwordInterval);
                this.passwordInterval = undefined;
              }

              this.authStage.set('visitor-authorized');
              this.authTimeoutId = setTimeout(() => {
                this.authStage.set('validating-status');

                this.authTimeoutId = setTimeout(() => {
                  this.authStage.set('welcome');

                  this.authTimeoutId = setTimeout(() => {
                    this.authStage.set('granted');
                  }, this.loginStageDuration);
                }, this.loginStageDuration);
              }, this.loginStageDuration);
            }
          }, 180);
        }, 500);
      }
    }, 220);
  }

  private clearAuthIntervals(): void {
    if (this.usernameInterval) {
      clearInterval(this.usernameInterval);
      this.usernameInterval = undefined;
    }

    if (this.passwordInterval) {
      clearInterval(this.passwordInterval);
      this.passwordInterval = undefined;
    }
  }

  private initializePong(): void {
    if (this.animationFrameId) {
      return;
    }

    const canvas = this._pongCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.pongCtx = context;
    this.resizeCanvas();
    this.resetBall();
    this.leftPaddleY = this.canvasHeight / 2 - this.paddleHeight / 2;
    this.rightPaddleY = this.leftPaddleY;

    window.addEventListener('resize', this.resizeHandler);
    this.animatePong();
  }

  private stopPong(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private resizeCanvas(): void {
    const canvas = this._pongCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
  }

  private animatePong(): void {
    this.updatePong();
    this.drawPong();
    this.animationFrameId = requestAnimationFrame(() => this.animatePong());
  }

  private updatePong(): void {
    const now = performance.now();
    const shouldForceScore = now >= this.nextForcedScoreAt;

    const ballCenterY = this.ballY + this.ballSize / 2;
    const leftCenter = this.leftPaddleY + this.paddleHeight / 2;
    const rightCenter = this.rightPaddleY + this.paddleHeight / 2;

    const leftApproaching = this.ballVX < 0;
    const rightApproaching = this.ballVX > 0;

    if (
      leftApproaching &&
      this.leftMissFrames === 0 &&
      this.ballX < this.canvasWidth * 0.32 &&
      Math.random() < 0.0007
    ) {
      this.leftMissFrames = 38 + Math.floor(Math.random() * 16);
    }

    if (
      rightApproaching &&
      this.rightMissFrames === 0 &&
      this.ballX > this.canvasWidth * 0.68 &&
      Math.random() < 0.0007
    ) {
      this.rightMissFrames = 38 + Math.floor(Math.random() * 16);
    }

    if (shouldForceScore && leftApproaching && this.ballX < this.canvasWidth * 0.42) {
      this.leftMissFrames = Math.max(this.leftMissFrames, 120);
    }

    if (shouldForceScore && rightApproaching && this.ballX > this.canvasWidth * 0.58) {
      this.rightMissFrames = Math.max(this.rightMissFrames, 120);
    }

    if (this.leftMissFrames > 0) {
      const escapeTarget = ballCenterY < this.canvasHeight / 2 ? this.canvasHeight * 0.82 : this.canvasHeight * 0.18;
      this.leftPaddleY += Math.sign(escapeTarget - leftCenter) * this.paddleSpeed * 1.35;
      this.leftMissFrames -= 1;
    } else {
      this.leftPaddleY += Math.sign(ballCenterY - leftCenter) * this.paddleSpeed;
    }

    if (this.rightMissFrames > 0) {
      const escapeTarget = ballCenterY < this.canvasHeight / 2 ? this.canvasHeight * 0.82 : this.canvasHeight * 0.18;
      this.rightPaddleY += Math.sign(escapeTarget - rightCenter) * this.paddleSpeed * 1.35;
      this.rightMissFrames -= 1;
    } else {
      this.rightPaddleY += Math.sign(ballCenterY - rightCenter) * this.paddleSpeed;
    }

    this.leftPaddleY = this.clampPaddle(this.leftPaddleY);
    this.rightPaddleY = this.clampPaddle(this.rightPaddleY);

    this.ballX += this.ballVX;
    this.ballY += this.ballVY;

    if (this.ballY <= 0 || this.ballY + this.ballSize >= this.canvasHeight) {
      this.ballVY *= -1;
      this.ballY = Math.max(0, Math.min(this.ballY, this.canvasHeight - this.ballSize));
    }

    const leftPaddleX = 64;
    const rightPaddleX = this.canvasWidth - 64 - this.paddleWidth;

    const hitsLeftPaddle =
      this.ballX <= leftPaddleX + this.paddleWidth &&
      this.ballX + this.ballSize >= leftPaddleX &&
      this.ballY + this.ballSize >= this.leftPaddleY &&
      this.ballY <= this.leftPaddleY + this.paddleHeight;

    const hitsRightPaddle =
      this.ballX + this.ballSize >= rightPaddleX &&
      this.ballX <= rightPaddleX + this.paddleWidth &&
      this.ballY + this.ballSize >= this.rightPaddleY &&
      this.ballY <= this.rightPaddleY + this.paddleHeight;

    if (hitsLeftPaddle && this.ballVX < 0) {
      const impactOffset = (ballCenterY - leftCenter) / (this.paddleHeight / 2);
      const nextSpeed = Math.min(Math.abs(this.ballVX) + 0.08, 4.2);
      this.ballVX = nextSpeed;
      this.ballVY = Math.max(-3.2, Math.min(3.2, this.ballVY + impactOffset * 0.45));
      this.ballX = leftPaddleX + this.paddleWidth;
    }

    if (hitsRightPaddle && this.ballVX > 0) {
      const impactOffset = (ballCenterY - rightCenter) / (this.paddleHeight / 2);
      const nextSpeed = Math.min(Math.abs(this.ballVX) + 0.08, 4.2);
      this.ballVX = -nextSpeed;
      this.ballVY = Math.max(-3.2, Math.min(3.2, this.ballVY + impactOffset * 0.45));
      this.ballX = rightPaddleX - this.ballSize;
    }

    if (this.ballX < -40) {
      this.rightScore += 1;
      this.handleScore('right');
      this.resetBall(1);
    }

    if (this.ballX > this.canvasWidth + 40) {
      this.leftScore += 1;
      this.handleScore('left');
      this.resetBall(-1);
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.992;
      particle.vy *= 0.992;
      particle.life -= 1;

      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    }
  }

  private drawPong(): void {
    if (!this.pongCtx) {
      return;
    }

    this.pongCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.pongCtx.fillStyle = 'rgba(2, 6, 23, 0.08)';
    this.pongCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.pongCtx.strokeStyle = 'rgba(236, 72, 153, 0.42)';
    this.pongCtx.lineWidth = 4;
    this.pongCtx.setLineDash([14, 16]);
    this.pongCtx.beginPath();
    this.pongCtx.moveTo(this.canvasWidth / 2, 0);
    this.pongCtx.lineTo(this.canvasWidth / 2, this.canvasHeight);
    this.pongCtx.stroke();
    this.pongCtx.setLineDash([]);

    this.pongCtx.shadowBlur = 20;
    this.pongCtx.shadowColor = 'rgba(167, 139, 250, 0.9)';
    this.pongCtx.fillStyle = 'rgba(196, 181, 253, 0.85)';
    this.pongCtx.fillRect(64, this.leftPaddleY, this.paddleWidth, this.paddleHeight);
    this.pongCtx.fillRect(
      this.canvasWidth - 64 - this.paddleWidth,
      this.rightPaddleY,
      this.paddleWidth,
      this.paddleHeight
    );

    this.pongCtx.shadowColor = 'rgba(103, 232, 249, 0.95)';
    this.pongCtx.fillStyle = 'rgba(103, 232, 249, 0.95)';
    this.pongCtx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize);

    this.pongCtx.shadowBlur = 14;
    for (const particle of this.particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      this.pongCtx.fillStyle = this.withAlpha(particle.color, alpha * 0.9);
      this.pongCtx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }

    this.pongCtx.shadowBlur = 0;
    this.pongCtx.fillStyle = 'rgba(248, 250, 252, 0.88)';
    this.pongCtx.font = '700 34px Inter, Segoe UI, sans-serif';
    this.pongCtx.textAlign = 'left';
    this.pongCtx.fillText(`${this.leftScore}`, 28, 46);
    this.pongCtx.textAlign = 'right';
    this.pongCtx.fillText(`${this.rightScore}`, this.canvasWidth - 28, 46);

    if (this.lastScoreSide && performance.now() - this.lastScoreTime < 950) {
      this.pongCtx.fillStyle = 'rgba(253, 224, 71, 0.88)';
      this.pongCtx.font = '700 18px Inter, Segoe UI, sans-serif';
      this.pongCtx.textAlign = 'center';
      this.pongCtx.fillText(
        `${this.lastScoreSide === 'left' ? 'LEFT' : 'RIGHT'} PLAYER SCORED!`,
        this.canvasWidth / 2,
        90
      );
    }
  }

  private handleScore(side: ScoreSide): void {
    this.lastScoreSide = side;
    this.lastScoreTime = performance.now();
    this.nextForcedScoreAt =
      this.lastScoreTime + this.forcedScoreIntervalMs + Math.random() * 25_000;
    this.spawnScoreParticles(side);
    this.playScoreSound();
  }

  private spawnScoreParticles(side: ScoreSide): void {
    const originX = side === 'left' ? this.canvasWidth * 0.38 : this.canvasWidth * 0.62;
    const originY = this.ballY + this.ballSize / 2;
    const palette = ['#f472b6', '#a78bfa', '#67e8f9', '#fde68a'];

    for (let index = 0; index < 42; index += 1) {
      const speed = 1.4 + Math.random() * 2.6;
      const angle = (Math.PI * 2 * index) / 42 + Math.random() * 0.55;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 26 + Math.floor(Math.random() * 18),
        maxLife: 44,
        color: palette[index % palette.length],
      });
    }
  }

  private playScoreSound(): void {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    if (!this.audioContext) {
      this.audioContext = new AudioContextConstructor();
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gainNode.connect(this.audioContext.destination);

    const firstTone = this.audioContext.createOscillator();
    firstTone.type = 'triangle';
    firstTone.frequency.setValueAtTime(540, now);
    firstTone.connect(gainNode);
    firstTone.start(now);
    firstTone.stop(now + 0.12);

    const secondTone = this.audioContext.createOscillator();
    secondTone.type = 'sine';
    secondTone.frequency.setValueAtTime(720, now + 0.1);
    secondTone.connect(gainNode);
    secondTone.start(now + 0.1);
    secondTone.stop(now + 0.22);
  }

  private withAlpha(hex: string, alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    if (!hex.startsWith('#') || hex.length !== 7) {
      return `rgba(255, 255, 255, ${clamped})`;
    }

    const red = parseInt(hex.slice(1, 3), 16);
    const green = parseInt(hex.slice(3, 5), 16);
    const blue = parseInt(hex.slice(5, 7), 16);
    return `rgba(${red}, ${green}, ${blue}, ${clamped})`;
  }

  private resetBall(direction?: 1 | -1): void {
    this.ballX = this.canvasWidth / 2 - this.ballSize / 2;
    this.ballY = this.canvasHeight / 2 - this.ballSize / 2;
    this.leftMissFrames = 0;
    this.rightMissFrames = 0;
    const horizontalDirection = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const verticalDirection = Math.random() > 0.5 ? 1 : -1;
    this.ballVX = horizontalDirection * (1.9 + Math.random() * 0.7);
    this.ballVY = verticalDirection * (1.2 + Math.random() * 0.8);
  }

  private clampPaddle(value: number): number {
    return Math.max(0, Math.min(value, this.canvasHeight - this.paddleHeight));
  }
}
