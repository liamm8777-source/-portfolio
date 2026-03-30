import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="home-shell" aria-label="Profile overview and section navigation">
      <section class="intro-card" aria-label="Introduction">
        <h1>Liam Malone</h1>
        <p class="contact">
          <a href="mailto:liam_malone@na.honda.com">liam_malone&#64;na.honda.com</a>
          <span aria-hidden="true">|</span>
          <a href="tel:+17403268764">(740) 326-8764</a>
        </p>
      </section>

      <div class="hero-image" role="img" aria-label="Portrait of Liam Malone">
        <img src="assets/IMG_9027.png" alt="Liam Malone" />
      </div>

      <nav class="section-nav" aria-label="Portfolio section pages">
        <a routerLink="/career" class="section-link">Career Profile</a>
        <a routerLink="/education" class="section-link">Education</a>
        <a routerLink="/skills" class="section-link">Technical Skills</a>
        <a routerLink="/open-chat" class="section-link">Open Chat</a>
      </nav>
    </section>
  `,
  styles: [
    `
      .home-shell {
        max-width: 420px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.9rem;
      }

      .intro-card {
        width: 100%;
        border: 1px solid transparent;
        border-radius: 1.15rem;
        padding: 0.9rem 1.05rem;
        text-align: center;
        background:
          linear-gradient(145deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.85)) padding-box,
          linear-gradient(
              140deg,
              rgba(244, 114, 182, 0.4),
              rgba(59, 130, 246, 0.38),
              rgba(14, 165, 233, 0.3)
            )
            border-box;
        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.34);
        backdrop-filter: blur(8px);
      }

      h1 {
        margin: 0;
        font-size: clamp(1.25rem, 1.9vw, 1.75rem);
        line-height: 1.1;
        letter-spacing: 0.02em;
        background: linear-gradient(105deg, #f8fafc 10%, #c4b5fd 40%, #f9a8d4 72%, #67e8f9 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .contact {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin: 0.55rem 0 0.1rem;
        font-size: 0.88rem;
        color: #e9d5ff;
      }

      .contact a {
        color: #e9d5ff;
        text-decoration: none;
        font-weight: 500;
      }

      .contact a:hover,
      .contact a:focus-visible {
        text-decoration: underline;
        text-decoration-color: #f0abfc;
      }

      .hero-image {
        width: min(330px, 100%);
        aspect-ratio: 3 / 4;
        border-radius: 50% / 42%;
        overflow: hidden;
        border: 4px solid rgba(236, 72, 153, 0.58);
        box-shadow:
          0 20px 48px rgba(15, 23, 42, 0.55),
          0 0 0 12px rgba(168, 85, 247, 0.16),
          0 0 42px rgba(236, 72, 153, 0.22);
      }

      .hero-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      .section-nav {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.55rem;
      }

      .section-link {
        text-decoration: none;
        color: #f8fafc;
        font-weight: 600;
        letter-spacing: 0.01em;
        border: 1px solid rgba(196, 181, 253, 0.45);
        border-radius: 0.8rem;
        padding: 0.66rem 0.82rem;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.82), rgba(51, 65, 85, 0.68));
        box-shadow: 0 7px 18px rgba(2, 6, 23, 0.28);
        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          border-color 180ms ease;
      }

      .section-link:hover,
      .section-link:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(233, 213, 255, 0.88);
        box-shadow: 0 12px 24px rgba(167, 139, 250, 0.24);
        outline: none;
      }

      .section-link {
        text-align: center;
        font-size: 0.84rem;
        line-height: 1.25;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {}
