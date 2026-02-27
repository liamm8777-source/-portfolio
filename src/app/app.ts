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

type PromptKey = 'professional-experience' | 'software-production' | 'my-future-projects';
type AuthStage =
  | 'unauthorized'
  | 'login'
  | 'visitor-authorized'
  | 'validating-status'
  | 'welcome'
  | 'granted';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('pongCanvas') private pongCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly selectedPrompt = signal<PromptKey>('professional-experience');
  protected readonly typedPromptText = signal('');
  protected readonly authStage = signal<AuthStage>('unauthorized');
  protected readonly username = signal('');
  protected readonly password = signal('');

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

  constructor() {
    this.startTyping('professional-experience');
    this.beginAuthSequence();
  }

  ngAfterViewInit(): void {
    this.initializePong();
  }

  protected selectPrompt(prompt: PromptKey): void {
    this.selectedPrompt.set(prompt);
    this.startTyping(prompt);
  }

  ngOnDestroy(): void {
    this.clearTypingInterval();
    this.clearAuthTimeout();
    this.clearAuthIntervals();
    this.stopPong();
  }

  private startTyping(prompt: PromptKey): void {
    this.clearTypingInterval();
    const fullText = this.promptContent[prompt].body;
    this.typedPromptText.set('');

    let index = 0;
    this.typingInterval = setInterval(() => {
      index += 1;
      this.typedPromptText.set(fullText.slice(0, index));

      if (index >= fullText.length) {
        this.clearTypingInterval();
      }
    }, 10);
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
    const canvas = this.pongCanvasRef?.nativeElement;
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
    const canvas = this.pongCanvasRef?.nativeElement;
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
    const ballCenterY = this.ballY + this.ballSize / 2;
    const leftCenter = this.leftPaddleY + this.paddleHeight / 2;
    const rightCenter = this.rightPaddleY + this.paddleHeight / 2;

    this.leftPaddleY += Math.sign(ballCenterY - leftCenter) * this.paddleSpeed;
    this.rightPaddleY += Math.sign(ballCenterY - rightCenter) * this.paddleSpeed;

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
      this.ballVX *= -1;
      this.ballX = leftPaddleX + this.paddleWidth;
    }

    if (hitsRightPaddle && this.ballVX > 0) {
      this.ballVX *= -1;
      this.ballX = rightPaddleX - this.ballSize;
    }

    if (this.ballX < -40) {
      this.rightScore += 1;
      this.resetBall(1);
    }

    if (this.ballX > this.canvasWidth + 40) {
      this.leftScore += 1;
      this.resetBall(-1);
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

    this.pongCtx.shadowBlur = 0;
    this.pongCtx.fillStyle = 'rgba(248, 250, 252, 0.75)';
    this.pongCtx.font = '700 30px Inter, Segoe UI, sans-serif';
    this.pongCtx.textAlign = 'center';
    this.pongCtx.fillText(`${this.leftScore}  :  ${this.rightScore}`, this.canvasWidth / 2, 56);
  }

  private resetBall(direction?: 1 | -1): void {
    this.ballX = this.canvasWidth / 2 - this.ballSize / 2;
    this.ballY = this.canvasHeight / 2 - this.ballSize / 2;
    const horizontalDirection = direction ?? (Math.random() > 0.5 ? 1 : -1);
    const verticalDirection = Math.random() > 0.5 ? 1 : -1;
    this.ballVX = horizontalDirection * (1.9 + Math.random() * 0.7);
    this.ballVY = verticalDirection * (1.2 + Math.random() * 0.8);
  }

  private clampPaddle(value: number): number {
    return Math.max(0, Math.min(value, this.canvasHeight - this.paddleHeight));
  }
}
