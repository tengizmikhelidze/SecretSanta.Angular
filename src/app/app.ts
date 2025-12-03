import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('secret-santa');
  protected readonly snowflakes = signal<Snowflake[]>([]);

  ngOnInit() {
    this.generateSnowflakes();
  }

  private generateSnowflakes() {
    const snowflakeCount = 50;
    const flakes: Snowflake[] = [];

    for (let i = 0; i < snowflakeCount; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 10 + Math.random() * 20,
        animationDelay: Math.random() * 10,
        size: 0.5 + Math.random(),
        opacity: 0.3 + Math.random() * 0.7
      });
    }

    this.snowflakes.set(flakes);
  }
}
