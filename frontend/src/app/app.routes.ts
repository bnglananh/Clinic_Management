import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { InternalLayoutComponent } from './layouts/internal-layout/internal-layout.component';
import { PatientLayoutComponent } from './layouts/patient-layout/patient-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { publicLandingGuard } from './core/guards/public-landing.guard';

export const routes: Routes = [
  // Authentication Routes
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
    ],
  },

  // Receptionist / Cashier Routes
  {
    path: 'reception',
    component: InternalLayoutComponent,
    canActivate: [authGuard, roleGuard(['RECEPTIONIST'])],
    children: [
      {
        path: '',
        redirectTo: 'checkin',
        pathMatch: 'full',
      },
      {
        path: 'checkin',
        loadComponent: () =>
          import('./features/reception/reception-checkin/reception-checkin.component').then(
            (m) => m.ReceptionCheckinComponent
          ),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/reception/reception-queue/reception-queue.component').then(
            (m) => m.ReceptionQueueComponent
          ),
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/reception/reception-patients/reception-patients.component').then(
            (m) => m.ReceptionPatientsComponent
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/reception/reception-billing/reception-billing.component').then(
            (m) => m.ReceptionBillingComponent
          ),
      },
    ],
  },

  // Doctor Clinical Workspace Routes
  {
    path: 'doctor',
    component: InternalLayoutComponent,
    canActivate: [authGuard, roleGuard(['DOCTOR'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/doctor/doctor-home/doctor-home.component').then(
            (m) => m.DoctorHomeComponent
          ),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/doctor/doctor-queue/doctor-queue.component').then(
            (m) => m.DoctorQueueComponent
          ),
      },
      {
        path: 'workspace',
        loadComponent: () =>
          import('./features/doctor/doctor-workspace/doctor-workspace.component').then(
            (m) => m.DoctorWorkspaceComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/doctor/doctor-history/doctor-history.component').then(
            (m) => m.DoctorHistoryComponent
          ),
      },
    ],
  },

  // Admin Routes
  {
    path: 'admin',
    component: InternalLayoutComponent,
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-home/admin-home.component').then(
            (m) => m.AdminHomeComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-home/admin-home.component').then(
            (m) => m.AdminHomeComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'pharmacy',
        loadComponent: () =>
          import('./features/admin/admin-pharmacy/admin-pharmacy.component').then(
            (m) => m.AdminPharmacyComponent
          ),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./features/admin/admin-services/admin-services.component').then(
            (m) => m.AdminServicesComponent
          ),
      },
      {
        path: 'schedules',
        loadComponent: () =>
          import('./features/admin/admin-schedules/admin-schedules.component').then(
            (m) => m.AdminSchedulesComponent
          ),
      },
    ],
  },

  // Patient Portal Routes
  {
    path: 'patient',
    component: PatientLayoutComponent,
    canActivate: [authGuard, roleGuard(['PATIENT'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/patient/patient-home/patient-home.component').then(
            (m) => m.PatientHomeComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/patient/patient-home/patient-home.component').then(
            (m) => m.PatientHomeComponent
          ),
      },
      {
        path: 'booking',
        loadComponent: () =>
          import('./features/patient/patient-booking/patient-booking.component').then(
            (m) => m.PatientBookingComponent
          ),
      },
      {
        path: 'queue',
        loadComponent: () =>
          import('./features/patient/patient-queue/patient-queue.component').then(
            (m) => m.PatientQueueComponent
          ),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./features/patient/patient-records/patient-records.component').then(
            (m) => m.PatientRecordsComponent
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/patient/patient-billing/patient-billing.component').then(
            (m) => m.PatientBillingComponent
          ),
      },
    ],
  },

  // Public Clinic Landing Portal
  {
    path: '',
    canActivate: [publicLandingGuard],
    loadComponent: () =>
      import('./features/landing/landing-home/landing-home.component').then(
        (m) => m.LandingHomeComponent
      ),
    pathMatch: 'full',
  },

  // Public Lobby Realtime Queue Display
  {
    path: 'lobby-display',
    loadComponent: () =>
      import('./features/landing/lobby-display/lobby-display.component').then(
        (m) => m.LobbyDisplayComponent
      ),
  },

  // Wildcard Fallback to Landing
  {
    path: '**',
    redirectTo: '',
  },
];
