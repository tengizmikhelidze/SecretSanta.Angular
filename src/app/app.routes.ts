import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        loadComponent: () => import('./features/landing/landing').then(c => c.Landing)
      },
      {
        path: "generator",
        loadComponent: () => import('./features/generator/generator').then(c => c.Generator)
      }
    ]
  }
];
