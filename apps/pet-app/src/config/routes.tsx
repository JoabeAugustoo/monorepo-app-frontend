import { AppRoute } from '@app/core';
import DashboardPage from '../pages/Dashboard';
import CustomersPage from '../pages/CustomersPage';
import PetsPage from '../pages/PetsPage';
import EmployeesPage from '../pages/EmployeesPage';
import PetRegisterPage from '../pages/PetRegisterPage';
import TutorPanelPage from '../pages/TutorPanelPage';
import MedicationsPage from '../pages/MedicationsPage';
import MedicationStockPage from '../pages/MedicationStockPage';
import ProceduresPage from '../pages/ProceduresPage';
import ProcedureFormPage from '../pages/ProcedureFormPage';
import ProcedureDetailPage from '../pages/ProcedureDetailPage';
import DocumentsPage from '../pages/DocumentsPage';
import ClinicPage from '../pages/ClinicPage';

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, index: true },
  { path: '/clinica', element: <ClinicPage /> },
  { path: '/clientes', element: <CustomersPage /> },
  { path: '/pets', element: <PetsPage /> },
  { path: '/funcionarios', element: <EmployeesPage /> },
  { path: '/cadastro-pet', element: <PetRegisterPage /> },
  { path: '/painel-tutor', element: <TutorPanelPage /> },
  { path: '/medicamentos', element: <MedicationsPage /> },
  { path: '/medicamentos/:id/estoque', element: <MedicationStockPage /> },
  { path: '/procedimentos', element: <ProceduresPage /> },
  { path: '/procedimentos/novo', element: <ProcedureFormPage /> },
  { path: '/procedimentos/:id', element: <ProcedureDetailPage /> },
  { path: '/documentos', element: <DocumentsPage /> },
];
