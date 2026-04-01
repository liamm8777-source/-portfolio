import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-hobbies-page',
  standalone: true,
  templateUrl: './hobbies-page.component.html',
  styleUrl: './hobbies-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HobbiesPageComponent {
  @ViewChild('snakeCanvas') private snakeCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly hobbies: ReadonlyArray<{ title: string; detail: string }> = [
    {
      title: 'Favorite Book Series',
      detail: 'Berserk is my favorite series for its atmosphere, visual identity, and long-form storytelling.',
    },
    {
      title: 'Favorite Artist',
      detail: 'Nujabes is my favorite artist, and his music is one of the main things I put on when I want to focus and build.',
    },
    {
      title: 'Creative Free Time',
      detail: 'In my free time, I enjoy experimenting with front-end development and trying new interface ideas, layouts, and interactions.',
    },
    {
      title: 'Work I Genuinely Enjoy',
      detail: 'I also genuinely love my current role at Honda and the opportunity to contribute as an Angular developer.',
    },
  ];

  private animationFrameId?: number;
  private resizeHandler = () => this.resizeCanvas();
  private ctx?: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private readonly cellSize = 26;
  private stepAccumulator = 0;
  private lastFrameTime = 0;
  private readonly snake: Array<{ x: number; y: number }> = [];
  private direction: { x: number; y: number } = { x: 1, y: 0 };
  private nextDirection: { x: number; y: number } = { x: 1, y: 0 };
  private food = { x: 0, y: 0 };
  private readonly particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  private gridCols = 0;
  private gridRows = 0;

  ngAfterViewInit(): void {
    this.initializeSnakeScene();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private initializeSnakeScene(): void {
    const canvas = this.snakeCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.ctx = context;
    this.resizeCanvas();
    this.resetSnake();
    window.addEventListener('resize', this.resizeHandler);
    this.animationFrameId = requestAnimationFrame((time) => this.animateSnake(time));
  }

  private resizeCanvas(): void {
    const canvas = this.snakeCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.gridCols = Math.max(12, Math.floor(this.canvasWidth / this.cellSize));
    this.gridRows = Math.max(12, Math.floor(this.canvasHeight / this.cellSize));

    if (!this.snake.length) {
      return;
    }

    this.snake.forEach((segment, index) => {
      segment.x = Math.min(this.gridCols - 2 - index, segment.x);
      segment.y = Math.min(this.gridRows - 2, segment.y);
    });
    this.food.x = Math.min(this.gridCols - 1, this.food.x);
    this.food.y = Math.min(this.gridRows - 1, this.food.y);
  }

  private resetSnake(): void {
    this.snake.length = 0;
    const startX = Math.floor(this.gridCols / 2);
    const startY = Math.floor(this.gridRows / 2);
    this.snake.push({ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY });
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.placeFood();
  }

  private animateSnake(timestamp: number): void {
    if (!this.ctx) {
      return;
    }

    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
    }

    const delta = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    this.stepAccumulator += delta;

    while (this.stepAccumulator >= 110) {
      this.stepAccumulator -= 110;
      this.updateSnake();
    }

    this.updateParticles();
    this.drawSnakeScene();
    this.animationFrameId = requestAnimationFrame((time) => this.animateSnake(time));
  }

  private updateSnake(): void {
    this.chooseDirection();
    this.direction = this.nextDirection;

    const head = this.snake[0];
    const nextHead = {
      x: (head.x + this.direction.x + this.gridCols) % this.gridCols,
      y: (head.y + this.direction.y + this.gridRows) % this.gridRows,
    };

    const hitsBody = this.snake.some((segment, index) => {
      if (index === this.snake.length - 1) {
        return false;
      }
      return segment.x === nextHead.x && segment.y === nextHead.y;
    });

    if (hitsBody) {
      this.resetSnake();
      return;
    }

    this.snake.unshift(nextHead);

    if (nextHead.x === this.food.x && nextHead.y === this.food.y) {
      this.spawnFoodParticles(nextHead.x, nextHead.y);
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  private chooseDirection(): void {
    const head = this.snake[0];
    const dx = this.food.x - head.x;
    const dy = this.food.y - head.y;

    const options = [
      Math.abs(dx) >= Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) },
      Math.abs(dx) < Math.abs(dy)
        ? { x: Math.sign(dx), y: 0 }
        : { x: 0, y: Math.sign(dy) },
      this.direction,
      { x: this.direction.y, y: this.direction.x },
      { x: -this.direction.y, y: -this.direction.x },
    ];

    for (const option of options) {
      if (option.x === 0 && option.y === 0) {
        continue;
      }

      if (option.x === -this.direction.x && option.y === -this.direction.y) {
        continue;
      }

      const nextX = (head.x + option.x + this.gridCols) % this.gridCols;
      const nextY = (head.y + option.y + this.gridRows) % this.gridRows;
      const collides = this.snake.some((segment, index) => {
        if (index === this.snake.length - 1) {
          return false;
        }
        return segment.x === nextX && segment.y === nextY;
      });

      if (!collides) {
        this.nextDirection = option;
        return;
      }
    }
  }

  private placeFood(): void {
    let nextX = 0;
    let nextY = 0;

    do {
      nextX = Math.floor(Math.random() * this.gridCols);
      nextY = Math.floor(Math.random() * this.gridRows);
    } while (this.snake.some((segment) => segment.x === nextX && segment.y === nextY));

    this.food = { x: nextX, y: nextY };
  }

  private spawnFoodParticles(gridX: number, gridY: number): void {
    const originX = gridX * this.cellSize + this.cellSize / 2;
    const originY = gridY * this.cellSize + this.cellSize / 2;

    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      const speed = 0.8 + Math.random() * 1.8;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 24 + Math.floor(Math.random() * 14),
      });
    }
  }

  private updateParticles(): void {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;

      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    }
  }

  private drawSnakeScene(): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = 'rgba(7, 7, 8, 0.84)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.strokeStyle = 'rgba(127, 29, 29, 0.16)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvasWidth; x += this.cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvasHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvasHeight; y += this.cellSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvasWidth, y);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 14;
    this.ctx.shadowColor = 'rgba(248, 113, 113, 0.42)';
    this.ctx.fillStyle = 'rgba(248, 113, 113, 0.78)';
    this.ctx.fillRect(
      this.food.x * this.cellSize + 5,
      this.food.y * this.cellSize + 5,
      this.cellSize - 10,
      this.cellSize - 10
    );

    this.ctx.shadowColor = 'rgba(220, 38, 38, 0.36)';
    for (let index = this.snake.length - 1; index >= 0; index -= 1) {
      const segment = this.snake[index];
      const inset = index === 0 ? 3 : 5;
      this.ctx.fillStyle = index === 0 ? 'rgba(254, 202, 202, 0.72)' : 'rgba(220, 38, 38, 0.58)';
      this.ctx.fillRect(
        segment.x * this.cellSize + inset,
        segment.y * this.cellSize + inset,
        this.cellSize - inset * 2,
        this.cellSize - inset * 2
      );
    }

    this.ctx.shadowColor = 'rgba(248, 113, 113, 0.28)';
    for (const particle of this.particles) {
      this.ctx.fillStyle = `rgba(254, 202, 202, ${Math.max(0, particle.life / 58)})`;
      this.ctx.fillRect(particle.x, particle.y, 3, 3);
    }

    this.ctx.shadowBlur = 0;
  }
}
