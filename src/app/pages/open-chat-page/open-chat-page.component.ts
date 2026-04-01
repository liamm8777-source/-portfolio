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

@Component({
  selector: 'app-open-chat-page',
  standalone: true,
  templateUrl: './open-chat-page.component.html',
  styleUrl: './open-chat-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenChatPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chatCanvas') private chatCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly selectedPrompt = signal<PromptKey>('professional-experience');
  protected readonly typedPromptText = signal('');

  private readonly promptContent: Record<PromptKey, { heading: string; body: string }> = {
    'professional-experience': {
      heading: 'Professional Experience & Technical Contributions',
      body:
        'I contributed to the design and development of advanced artificial intelligence models and production-ready software solutions for Honda mobile applications. My work focused on building and integrating backend connections between MPC servers and multiple AI models, enabling collaborative and scalable AI workflows across systems.\n\n' +
        'I collaborated with experienced developers in a fast-paced environment, supporting architecture decisions, problem-solving strategies, and day-to-day implementation work. This role demanded critical thinking, rapid adaptation to changing requirements, and a consistent focus on delivering secure, reliable, and maintainable code.\n\n' +
        'In addition to development responsibilities, I served as a dedicated code reviewer, helping maintain quality standards and consistency across projects while providing technical feedback to improve readability, performance, and long-term maintainability.\n\n' +
        'I also created and implemented a structured Markdown-based workflow for communicating with AI systems in a format aligned to large language model context processing. This framework was adopted internally and is actively used by developers at Honda to improve AI collaboration, prompt structure, and delivery efficiency.',
    },
    'software-production': {
      heading: 'Software Developed by Me in Production',
      body:
        'I proposed and delivered more than ten high-impact product and technical improvements for one of Honda\'s largest mobile applications used directly on the production floor.\n\n' +
        'Each recommendation was formally reviewed by business and technical stakeholders, approved, and is now fully implemented in the live production environment. I independently analyzed the existing codebase, implemented the enhancements, validated their functionality, and presented completed solutions to the business team for final adoption.\n\n' +
        'These contributions improved application usability, performance, and operational efficiency for frontline manufacturing users while ensuring alignment with production standards, reliability requirements, and enterprise development practices.',
    },
    'my-future-projects': {
      heading: 'My Future Projects',
      body:
        'I plan to design and build my own local AI coding models that run entirely on my own hardware, without relying on cloud-based inference.\n\n' +
        'My approach will involve leveraging advanced external models as teachers to help train and refine my local model\'s coding capabilities, with practical integrations for code generation, refactoring, documentation, and testing.\n\n' +
        'This initiative is a long-term research and engineering effort that I am actively planning and excited to pursue as part of my continued growth in AI and software development.',
    },
  };

  protected readonly currentPrompt = computed(() => this.promptContent[this.selectedPrompt()]);
  private typingInterval?: ReturnType<typeof setInterval>;
  private animationFrameId?: number;
  private resizeHandler = () => this.resizeCanvas();
  private ctx?: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private sceneTime = 0;
  private promptPacketTick = 0;
  private responsePacketTick = 0;
  private readonly packets: Array<{
    direction: 'prompt' | 'response';
    lane: number;
    progress: number;
    speed: number;
    radius: number;
  }> = [];
  private readonly ripples: Array<{ x: number; y: number; radius: number; alpha: number; growth: number }> = [];
  private readonly satellites = [
    { orbit: 52, size: 5, speed: 0.008, angle: 0 },
    { orbit: 74, size: 7, speed: -0.005, angle: Math.PI / 2 },
    { orbit: 94, size: 4, speed: 0.006, angle: Math.PI },
  ];
  private readonly themeByPrompt: Record<
    PromptKey,
    { inbound: string; outbound: string; glow: string; core: string; background: [string, string, string] }
  > = {
    'professional-experience': {
      inbound: 'rgba(125, 211, 252, 0.96)',
      outbound: 'rgba(192, 132, 252, 0.96)',
      glow: 'rgba(56, 189, 248, 0.42)',
      core: 'rgba(244, 114, 182, 0.88)',
      background: ['rgba(7, 10, 24, 0.97)', 'rgba(23, 37, 84, 0.94)', 'rgba(76, 29, 149, 0.78)'],
    },
    'software-production': {
      inbound: 'rgba(52, 211, 153, 0.96)',
      outbound: 'rgba(251, 191, 36, 0.96)',
      glow: 'rgba(16, 185, 129, 0.4)',
      core: 'rgba(250, 204, 21, 0.9)',
      background: ['rgba(5, 15, 23, 0.98)', 'rgba(6, 78, 59, 0.9)', 'rgba(120, 53, 15, 0.72)'],
    },
    'my-future-projects': {
      inbound: 'rgba(196, 181, 253, 0.98)',
      outbound: 'rgba(125, 211, 252, 0.98)',
      glow: 'rgba(129, 140, 248, 0.45)',
      core: 'rgba(96, 165, 250, 0.9)',
      background: ['rgba(8, 12, 32, 0.98)', 'rgba(49, 46, 129, 0.9)', 'rgba(14, 116, 144, 0.74)'],
    },
  };

  constructor() {
    this.startTyping('professional-experience');
  }

  ngAfterViewInit(): void {
    this.initializeChatScene();
  }

  protected selectPrompt(prompt: PromptKey): void {
    this.selectedPrompt.set(prompt);
    this.startTyping(prompt);
    this.spawnRipple(this.canvasWidth * 0.72, this.canvasHeight * 0.48, 26, 0.9, 1.45);
  }

  ngOnDestroy(): void {
    this.clearTypingInterval();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private initializeChatScene(): void {
    const canvas = this.chatCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.ctx = context;
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeHandler);
    this.animateChatScene();
  }

  private resizeCanvas(): void {
    const canvas = this.chatCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = Math.max(320, Math.floor(rect.width));
    this.canvasHeight = Math.max(360, Math.floor(rect.height));
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
  }

  private animateChatScene(): void {
    this.updateChatScene();
    this.drawChatScene();
    this.animationFrameId = requestAnimationFrame(() => this.animateChatScene());
  }

  private updateChatScene(): void {
    this.sceneTime += 0.016;
    this.promptPacketTick += 1;
    this.responsePacketTick += 1;

    const prompt = this.selectedPrompt();
    const promptCadence = prompt === 'software-production' ? 18 : prompt === 'my-future-projects' ? 22 : 20;
    const responseCadence = prompt === 'professional-experience' ? 26 : prompt === 'software-production' ? 22 : 28;

    if (this.promptPacketTick >= promptCadence) {
      this.promptPacketTick = 0;
      this.spawnPacket('prompt');
    }

    if (this.responsePacketTick >= responseCadence) {
      this.responsePacketTick = 0;
      this.spawnPacket('response');
    }

    for (const satellite of this.satellites) {
      satellite.angle += satellite.speed;
    }

    for (let index = this.packets.length - 1; index >= 0; index -= 1) {
      const packet = this.packets[index];
      packet.progress += packet.speed;

      if (packet.progress >= 1) {
        const endpoint = this.getSignalPoint(1, packet.lane, packet.direction);
        this.spawnRipple(endpoint.x, endpoint.y, 14 + packet.lane * 2, 0.8, 1.6);
        this.packets.splice(index, 1);
      }
    }

    for (let index = this.ripples.length - 1; index >= 0; index -= 1) {
      const ripple = this.ripples[index];
      ripple.radius += ripple.growth;
      ripple.alpha *= 0.97;

      if (ripple.alpha <= 0.02) {
        this.ripples.splice(index, 1);
      }
    }
  }

  private spawnPacket(direction: 'prompt' | 'response'): void {
    this.packets.push({
      direction,
      lane: [-1, 0, 1][Math.floor(Math.random() * 3)],
      progress: 0,
      speed: 0.012 + Math.random() * 0.02,
      radius: 4 + Math.random() * 2,
    });
  }

  private spawnRipple(x: number, y: number, radius: number, alpha: number, growth: number): void {
    this.ripples.push({ x, y, radius, alpha, growth });
  }

  private drawChatScene(): void {
    if (!this.ctx) {
      return;
    }

    const theme = this.themeByPrompt[this.selectedPrompt()];
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const background = this.ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    background.addColorStop(0, theme.background[0]);
    background.addColorStop(0.5, theme.background[1]);
    background.addColorStop(1, theme.background[2]);
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = 'rgba(3, 6, 16, 0.34)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 32; x < this.canvasWidth; x += 32) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvasHeight);
      this.ctx.stroke();
    }

    const terminal = { x: this.canvasWidth * 0.18, y: this.canvasHeight * 0.52 };
    const model = { x: this.canvasWidth * 0.74, y: this.canvasHeight * 0.46 };

    for (const lane of [-1, 0, 1]) {
      this.drawSignalLane(lane, 'prompt', theme.glow);
      this.drawSignalLane(lane, 'response', theme.glow);
    }

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
    this.ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
    this.ctx.lineWidth = 1.4;
    this.ctx.beginPath();
    this.roundRect(this.ctx, terminal.x - 52, terminal.y - 42, 104, 84, 18);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
    this.ctx.fillRect(terminal.x - 32, terminal.y - 18, 64, 12);
    this.ctx.fillRect(terminal.x - 32, terminal.y + 2, 48, 12);

    this.ctx.beginPath();
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    this.ctx.arc(model.x, model.y, 32, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.shadowBlur = 16;
    this.ctx.shadowColor = theme.glow;
    this.ctx.strokeStyle = theme.core.replace('0.88', '0.52').replace('0.9', '0.52');
    this.ctx.lineWidth = 2;
    this.ctx.arc(model.x, model.y, 32, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    for (const ripple of this.ripples) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(226, 232, 240, ${ripple.alpha * 0.42})`;
      this.ctx.lineWidth = 1;
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    for (const satellite of this.satellites) {
      const x = model.x + Math.cos(satellite.angle) * satellite.orbit;
      const y = model.y + Math.sin(satellite.angle) * satellite.orbit * 0.72;
      this.ctx.beginPath();
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
      this.ctx.arc(x, y, satellite.size + 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.fillStyle = theme.outbound.replace('0.96', '0.48').replace('0.98', '0.48');
      this.ctx.arc(x, y, satellite.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    for (const packet of this.packets) {
      const point = this.getSignalPoint(packet.progress, packet.lane, packet.direction);
      this.ctx.beginPath();
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = packet.direction === 'prompt'
        ? theme.inbound.replace('0.96', '0.42').replace('0.98', '0.42')
        : theme.outbound.replace('0.96', '0.42').replace('0.98', '0.42');
      this.ctx.fillStyle = packet.direction === 'prompt'
        ? theme.inbound.replace('0.96', '0.42').replace('0.98', '0.42')
        : theme.outbound.replace('0.96', '0.42').replace('0.98', '0.42');
      this.ctx.arc(point.x, point.y, packet.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private drawSignalLane(lane: number, direction: 'prompt' | 'response', strokeStyle: string): void {
    if (!this.ctx) {
      return;
    }

    const start = this.getSignalPoint(0, lane, direction);
    const end = this.getSignalPoint(1, lane, direction);
    const control = this.getSignalControlPoint(lane, direction);

    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeStyle.replace('0.42', '0.28').replace('0.4', '0.28').replace('0.45', '0.28');
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(start.x, start.y);
    this.ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    this.ctx.stroke();
  }

  private getSignalPoint(progress: number, lane: number, direction: 'prompt' | 'response'): { x: number; y: number } {
    const start = direction === 'prompt'
      ? { x: this.canvasWidth * 0.23, y: this.canvasHeight * (0.5 + lane * 0.1) }
      : { x: this.canvasWidth * 0.7, y: this.canvasHeight * (0.42 + lane * 0.08) };
    const end = direction === 'prompt'
      ? { x: this.canvasWidth * 0.68, y: this.canvasHeight * (0.42 + lane * 0.08) }
      : { x: this.canvasWidth * 0.25, y: this.canvasHeight * (0.5 + lane * 0.1) };
    const control = this.getSignalControlPoint(lane, direction);
    const inverse = 1 - progress;

    return {
      x: inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
      y: inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y,
    };
  }

  private getSignalControlPoint(lane: number, direction: 'prompt' | 'response'): { x: number; y: number } {
    const sway = Math.sin(this.sceneTime * 1.3 + lane + (direction === 'prompt' ? 0 : Math.PI / 2)) * 18;
    return {
      x: this.canvasWidth * 0.48,
      y: this.canvasHeight * (0.28 + lane * 0.13) + sway,
    };
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private startTyping(prompt: PromptKey): void {
    this.clearTypingInterval();
    const fullText = this.promptContent[prompt].body;
    this.typedPromptText.set('');

    let index = 0;
    const charsPerTick = fullText.length > 1300 ? 4 : 2;
    this.typingInterval = setInterval(() => {
      index = Math.min(index + charsPerTick, fullText.length);
      this.typedPromptText.set(fullText.slice(0, index));

      if (index >= fullText.length) {
        this.clearTypingInterval();
      }
    }, 16);
  }

  private clearTypingInterval(): void {
    if (!this.typingInterval) {
      return;
    }

    clearInterval(this.typingInterval);
    this.typingInterval = undefined;
  }
}
