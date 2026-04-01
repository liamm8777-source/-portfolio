import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-skills-page',
  standalone: true,
  templateUrl: './skills-page.component.html',
  styleUrl: './skills-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('skillsCanvas') private skillsCanvasRef?: ElementRef<HTMLCanvasElement>;

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

  private animationFrameId?: number;
  private resizeHandler = () => this.resizeCanvas();
  private ctx?: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private packetSpawnTick = 0;
  private sceneTime = 0;
  private readonly nodes: Array<{
    xRatio: number;
    yRatio: number;
    column: number;
    row: number;
    charge: number;
    pulseDirection: number;
  }> = [];
  private readonly connections: Array<{ from: number; to: number; activity: number }> = [];
  private readonly packets: Array<{
    connectionIndex: number;
    progress: number;
    speed: number;
    radius: number;
    hue: number;
    hopsRemaining: number;
  }> = [];
  private readonly sparks: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];

  ngAfterViewInit(): void {
    this.initializeSkillsScene();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    window.removeEventListener('resize', this.resizeHandler);
  }

  private initializeSkillsScene(): void {
    const canvas = this.skillsCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    this.ctx = context;
    this.resizeCanvas();
    this.buildNetworkGraph();
    window.addEventListener('resize', this.resizeHandler);
    this.animateSkillsScene();
  }

  private resizeCanvas(): void {
    const canvas = this.skillsCanvasRef?.nativeElement;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    this.canvasWidth = Math.max(320, Math.floor(rect.width));
    this.canvasHeight = Math.max(360, Math.floor(rect.height));
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.buildNetworkGraph();
  }

  private buildNetworkGraph(): void {
    this.nodes.length = 0;
    this.connections.length = 0;
    this.packets.length = 0;
    this.sparks.length = 0;

    const columns = [0.1, 0.33, 0.58, 0.82];
    const rows = [0.22, 0.42, 0.62, 0.82];

    for (let column = 0; column < columns.length; column += 1) {
      for (let row = 0; row < rows.length; row += 1) {
        const rowVariance = ((column + row) % 2 === 0 ? -1 : 1) * 0.03;
        this.nodes.push({
          xRatio: columns[column],
          yRatio: Math.min(0.88, Math.max(0.12, rows[row] + rowVariance)),
          column,
          row,
          charge: Math.random() * 0.6,
          pulseDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    const getNodeIndex = (column: number, row: number) => column * rows.length + row;
    for (let column = 0; column < columns.length - 1; column += 1) {
      for (let row = 0; row < rows.length; row += 1) {
        const from = getNodeIndex(column, row);
        const forwardRows = [row, Math.max(0, row - 1), Math.min(rows.length - 1, row + 1)];

        for (const targetRow of forwardRows) {
          const to = getNodeIndex(column + 1, targetRow);
          if (!this.connections.some((connection) => connection.from === from && connection.to === to)) {
            this.connections.push({ from, to, activity: Math.random() * 0.35 });
          }
        }
      }
    }
  }

  private animateSkillsScene(): void {
    this.updateSkillsScene();
    this.drawSkillsScene();
    this.animationFrameId = requestAnimationFrame(() => this.animateSkillsScene());
  }

  private updateSkillsScene(): void {
    this.sceneTime += 0.016;
    this.packetSpawnTick += 1;

    if (this.packetSpawnTick >= 18) {
      this.packetSpawnTick = 0;
      this.spawnPacket();
    }

    for (const node of this.nodes) {
      node.charge = Math.max(0.08, node.charge + node.pulseDirection * 0.006);
      if (node.charge >= 0.95 || node.charge <= 0.08) {
        node.pulseDirection *= -1;
      }
    }

    for (const connection of this.connections) {
      connection.activity = Math.max(0.08, connection.activity * 0.986);
    }

    for (let index = this.packets.length - 1; index >= 0; index -= 1) {
      const packet = this.packets[index];
      packet.progress += packet.speed;

      const connection = this.connections[packet.connectionIndex];
      if (connection) {
        connection.activity = Math.min(1, connection.activity + 0.035);
      }

      if (packet.progress >= 1) {
        this.completePacket(index, packet);
      }
    }

    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= 0.985;
      spark.vy *= 0.985;
      spark.life -= 1;

      if (spark.life <= 0) {
        this.sparks.splice(index, 1);
      }
    }
  }

  private spawnPacket(connectionIndex?: number, hue?: number, hopsRemaining?: number): void {
    if (this.connections.length === 0) {
      return;
    }

    const nextConnectionIndex = connectionIndex ?? Math.floor(Math.random() * this.connections.length);
    this.packets.push({
      connectionIndex: nextConnectionIndex,
      progress: 0,
      speed: 0.014 + Math.random() * 0.018,
      radius: 3 + Math.random() * 2,
      hue: hue ?? 188 + Math.random() * 90,
      hopsRemaining: hopsRemaining ?? (2 + Math.floor(Math.random() * 4)),
    });
  }

  private completePacket(
    packetIndex: number,
    packet: { connectionIndex: number; hue: number; hopsRemaining: number },
  ): void {
    const connection = this.connections[packet.connectionIndex];
    if (!connection) {
      this.packets.splice(packetIndex, 1);
      return;
    }

    const destinationNode = this.nodes[connection.to];
    destinationNode.charge = 1;
    this.spawnSparks(this.getNodeX(destinationNode), this.getNodeY(destinationNode));
    this.packets.splice(packetIndex, 1);

    if (packet.hopsRemaining <= 0) {
      return;
    }

    const outboundConnections = this.connections
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.from === connection.to);

    if (outboundConnections.length === 0) {
      return;
    }

    const nextConnection = outboundConnections[Math.floor(Math.random() * outboundConnections.length)];
    this.spawnPacket(nextConnection.index, packet.hue, packet.hopsRemaining - 1);
  }

  private spawnSparks(x: number, y: number): void {
    const count = 6 + Math.floor(Math.random() * 6);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
      const speed = 0.8 + Math.random() * 1.8;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 18 + Math.floor(Math.random() * 18),
        maxLife: 36,
      });
    }
  }

  private drawSkillsScene(): void {
    if (!this.ctx) {
      return;
    }

    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const background = this.ctx.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeight);
    background.addColorStop(0, 'rgba(7, 10, 24, 0.96)');
    background.addColorStop(0.55, 'rgba(20, 29, 61, 0.92)');
    background.addColorStop(1, 'rgba(9, 47, 73, 0.9)');
    this.ctx.fillStyle = background;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.fillStyle = 'rgba(3, 8, 18, 0.34)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(125, 211, 252, 0.09)';
    for (let x = 40; x < this.canvasWidth; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvasHeight);
      this.ctx.stroke();
    }
    for (let y = 40; y < this.canvasHeight; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvasWidth, y);
      this.ctx.stroke();
    }

    for (const connection of this.connections) {
      const fromNode = this.nodes[connection.from];
      const toNode = this.nodes[connection.to];
      const gradient = this.ctx.createLinearGradient(
        this.getNodeX(fromNode),
        this.getNodeY(fromNode),
        this.getNodeX(toNode),
        this.getNodeY(toNode),
      );
      gradient.addColorStop(0, `rgba(96, 165, 250, ${0.12 + connection.activity * 0.24})`);
      gradient.addColorStop(1, `rgba(52, 211, 153, ${0.1 + connection.activity * 0.28})`);
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.1 + connection.activity * 1.35;
      this.ctx.beginPath();
      this.ctx.moveTo(this.getNodeX(fromNode), this.getNodeY(fromNode));
      this.ctx.lineTo(this.getNodeX(toNode), this.getNodeY(toNode));
      this.ctx.stroke();
    }

    for (const packet of this.packets) {
      const { x, y } = this.getPacketPosition(packet);
      this.ctx.beginPath();
      this.ctx.fillStyle = `hsla(${packet.hue}, 80%, 66%, 0.46)`;
      this.ctx.shadowBlur = 11;
      this.ctx.shadowColor = `hsla(${packet.hue}, 85%, 62%, 0.42)`;
      this.ctx.arc(x, y, packet.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
    for (const spark of this.sparks) {
      const alpha = spark.life / spark.maxLife;
      this.ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, alpha * 0.48)})`;
      this.ctx.fillRect(spark.x, spark.y, 2, 2);
    }

    for (const node of this.nodes) {
      const x = this.getNodeX(node);
      const y = this.getNodeY(node);
      const radius = 7 + node.charge * 4;
      this.ctx.beginPath();
      this.ctx.fillStyle = `rgba(15, 23, 42, ${0.64 - node.charge * 0.16})`;
      this.ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.shadowBlur = 14;
      this.ctx.shadowColor = `rgba(34, 211, 238, ${0.16 + node.charge * 0.24})`;
      this.ctx.fillStyle = `rgba(125, 211, 252, ${0.22 + node.charge * 0.28})`;
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(167, 243, 208, ${0.16 + node.charge * 0.24})`;
      this.ctx.lineWidth = 0.95;
      this.ctx.arc(x, y, radius + 9 + Math.sin(this.sceneTime * 1.7 + node.column + node.row) * 2.5, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  private getPacketPosition(packet: { connectionIndex: number; progress: number }): { x: number; y: number } {
    const connection = this.connections[packet.connectionIndex];
    const fromNode = this.nodes[connection.from];
    const toNode = this.nodes[connection.to];
    return {
      x: this.getNodeX(fromNode) + (this.getNodeX(toNode) - this.getNodeX(fromNode)) * packet.progress,
      y: this.getNodeY(fromNode) + (this.getNodeY(toNode) - this.getNodeY(fromNode)) * packet.progress,
    };
  }

  private getNodeX(node: { xRatio: number }): number {
    return this.canvasWidth * node.xRatio;
  }

  private getNodeY(node: { yRatio: number }): number {
    return this.canvasHeight * node.yRatio;
  }
}
