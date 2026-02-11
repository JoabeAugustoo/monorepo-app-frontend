import { AppRoute } from '@app/core';
import DashboardPage from '../pages/Dashboard';
import PetList from '../pages/PetList';
import PetForm from '../pages/PetForm';
import Settings from '../pages/Settings';
import Components from '../pages/Components';

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, index: true },
  { path: '/pets', element: <PetList /> },
  { path: '/pets/novo', element: <PetForm /> },
  { path: '/pets/:id/editar', element: <PetForm /> },
  { path: '/configuracoes', element: <Settings /> },
  { path: '/componentes', element: <Components /> },
];
