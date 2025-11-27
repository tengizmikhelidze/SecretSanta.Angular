import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        loadComponent: () => import('./features/landing/landing').then(c=> c.Landing)
      }
    ]
  }
];
