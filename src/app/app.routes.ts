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
      },
      {
        path: "success/:id",
        loadComponent: () => import('./features/success/success').then(c => c.Success)
      },
      {
        path: "account",
        loadComponent: () => import('./features/account/account').then(c => c.Account)
      },
      {
        path: "party/:id",
        loadComponent: () => import('./features/party/party').then(c => c.Party)
      }
    ]
  }
];
