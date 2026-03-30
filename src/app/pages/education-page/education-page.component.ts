import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-education-page',
  standalone: true,
  templateUrl: './education-page.component.html',
  styleUrl: './education-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationPageComponent {
  @ViewChild('asteroidsCanvas') private asteroidsCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly highlights: ReadonlyArray<string> = [
    "Dean's List Recipient",
    'Hands-on focus on software development fundamentals and practical implementation.',
    'Coursework aligned with real-world engineering, cloud, and networking foundations.',
  ];

  protected readonly coursework: ReadonlyArray<string> = [
    'Database Fundamentals',
    'Networking Principles',
    'Introduction to Python',
    'HTML',
    'Computer Concepts and Applications',
    'Cloud Foundations',
  ];

  private animationFrameId?: number;
  private resizeHandler = () => this.resizeCanvas();
  private ctx?: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private asteroidSpawnTick = 0;
  private laserTick = 0;
  private readonly stars: Array<{ x: number; y: number; size: number; alpha: number }> = [];
  private readonly asteroids: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    radius: number;
  }> = [];
  private readonly lasers: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
  private readonly fragments: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];

  ngAfterViewInit(): void {
    this.initializeAsteroids();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private initializeAsteroids(): void {
    const canvas = this.asteroidsCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.ctx = context;
    this.resizeCanvas();
    this.seedStars();
    window.addEventListener('resize', this.resizeHandler);
    this.animateAsteroids();
  }

  private resizeCanvas(): void {
    const canvas = this.asteroidsCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = Math.max(320, Math.floor(rect.width));
    this.canvasHeight = Math.max(320, Math.floor(rect.height));
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.seedStars();
  }

  private seedStars(): void {
    this.stars.length = 0;

    const starCount = Math.max(24, Math.floor((this.canvasWidth * this.canvasHeight) / 18000));
    for (let index = 0; index < starCount; index += 1) {
      this.stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.55,
      });
    }
  }

  private animateAsteroids(): void {
    this.updateAsteroidsScene();
    this.drawAsteroidsScene();
    this.animationFrameId = requestAnimationFrame(() => this.animateAsteroids());
  }

  private updateAsteroidsScene(): void {
    this.asteroidSpawnTick += 1;
    this.laserTick += 1;

    if (this.asteroidSpawnTick >= 42) {
      this.asteroidSpawnTick = 0;
      this.spawnAsteroid();
    }

    if (this.laserTick >= 14) {
      this.laserTick = 0;
      this.fireLaser();
    }

    for (let index = this.asteroids.length - 1; index >= 0; index -= 1) {
      const asteroid = this.asteroids[index];
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.rotation += asteroid.rotationSpeed;

      if (
        asteroid.x < -asteroid.radius * 2 ||
        asteroid.x > this.canvasWidth + asteroid.radius * 2 ||
        asteroid.y > this.canvasHeight + asteroid.radius * 2
      ) {
        this.asteroids.splice(index, 1);
      }
    }

    for (let index = this.lasers.length - 1; index >= 0; index -= 1) {
      const laser = this.lasers[index];
      laser.x += laser.vx;
      laser.y += laser.vy;
      laser.life -= 1;

      if (laser.life <= 0 || laser.y < -40) {
        this.lasers.splice(index, 1);
      }
    }

    for (let laserIndex = this.lasers.length - 1; laserIndex >= 0; laserIndex -= 1) {
      const laser = this.lasers[laserIndex];

      for (let asteroidIndex = this.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
        const asteroid = this.asteroids[asteroidIndex];
        const dx = laser.x - asteroid.x;
        const dy = laser.y - asteroid.y;

        if (Math.hypot(dx, dy) <= asteroid.radius + 6) {
          this.spawnFragments(asteroid.x, asteroid.y, asteroid.radius);
          this.asteroids.splice(asteroidIndex, 1);
          this.lasers.splice(laserIndex, 1);
          break;
        }
      }
    }

    for (let index = this.fragments.length - 1; index >= 0; index -= 1) {
      const fragment = this.fragments[index];
      fragment.x += fragment.vx;
      fragment.y += fragment.vy;
      fragment.vx *= 0.986;
      fragment.vy *= 0.986;
      fragment.life -= 1;

      if (fragment.life <= 0) {
        this.fragments.splice(index, 1);
      }
    }
  }

  private spawnAsteroid(): void {
    const fromLeft = Math.random() > 0.5;
    const radius = 16 + Math.random() * 22;
    const x = fromLeft ? -radius : this.canvasWidth + radius;
    const y = -radius + Math.random() * this.canvasHeight * 0.38;
    const targetX = this.canvasWidth * (0.5 + (Math.random() - 0.5) * 0.35);
    const targetY = this.canvasHeight * (0.82 + Math.random() * 0.08);
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = 1 + Math.random() * 1.2;

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.045,
      radius,
    });
  }

  private fireLaser(): void {
    const ship = this.getShipPosition();
    const aimTarget = this.asteroids[0];
    const angle = aimTarget
      ? Math.atan2(aimTarget.y - ship.y, aimTarget.x - ship.x)
      : -Math.PI / 2;

    this.lasers.push({
      x: ship.x,
      y: ship.y - 12,
      vx: Math.cos(angle) * 7.2,
      vy: Math.sin(angle) * 7.2,
      life: 70,
    });
  }

  private spawnFragments(x: number, y: number, radius: number): void {
    const count = 12 + Math.floor(radius / 3);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
      const speed = 1.2 + Math.random() * 2.8;
      this.fragments.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 18 + Math.floor(Math.random() * 18),
        maxLife: 36,
      });
    }
  }

  private drawAsteroidsScene(): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    for (const star of this.stars) {
      this.ctx.fillStyle = `rgba(148, 163, 184, ${star.alpha})`;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    this.ctx.strokeStyle = 'rgba(103, 232, 249, 0.95)';
    this.ctx.lineWidth = 2.2;
    this.ctx.shadowBlur = 16;
    this.ctx.shadowColor = 'rgba(103, 232, 249, 0.55)';

    const ship = this.getShipPosition();
    this.ctx.beginPath();
    this.ctx.moveTo(ship.x, ship.y - 18);
    this.ctx.lineTo(ship.x - 13, ship.y + 14);
    this.ctx.lineTo(ship.x + 13, ship.y + 14);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(ship.x - 6, ship.y + 14);
    this.ctx.lineTo(ship.x, ship.y + 22);
    this.ctx.lineTo(ship.x + 6, ship.y + 14);
    this.ctx.stroke();

    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = 'rgba(244, 114, 182, 0.65)';
    this.ctx.fillStyle = 'rgba(248, 113, 113, 0.95)';
    for (const laser of this.lasers) {
      this.ctx.fillRect(laser.x - 1.5, laser.y - 8, 3, 12);
    }

    this.ctx.shadowBlur = 18;
    this.ctx.shadowColor = 'rgba(196, 181, 253, 0.5)';
    this.ctx.strokeStyle = 'rgba(226, 232, 240, 0.82)';
    this.ctx.lineWidth = 2;
    for (const asteroid of this.asteroids) {
      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate(asteroid.rotation);
      this.ctx.beginPath();
      this.ctx.moveTo(asteroid.radius, 0);
      for (let point = 1; point <= 7; point += 1) {
        const angle = (Math.PI * 2 * point) / 7;
        const variance = asteroid.radius * (0.72 + ((point % 2) * 0.2 + Math.random() * 0.08));
        this.ctx.lineTo(Math.cos(angle) * variance, Math.sin(angle) * variance);
      }
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.restore();
    }

    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = 'rgba(250, 204, 21, 0.5)';
    for (const fragment of this.fragments) {
      const alpha = Math.max(0, fragment.life / fragment.maxLife);
      this.ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
      this.ctx.fillRect(fragment.x, fragment.y, 3, 3);
    }

    this.ctx.shadowBlur = 0;
  }

  private getShipPosition(): { x: number; y: number } {
    return {
      x: this.canvasWidth / 2,
      y: this.canvasHeight - 72,
    };
  }
}
