import { AppRoute } from '@app/core';
import DashboardPage from '../pages/Dashboard';
import CustomersPage from '../pages/CustomersPage';
import CustomerFormPage from '../pages/CustomerFormPage';
import PetsPage from '../pages/PetsPage';
import PetFormPage from '../pages/PetFormPage';
import EmployeesPage from '../pages/EmployeesPage';
import EmployeeFormPage from '../pages/EmployeeFormPage';
import PetRegisterPage from '../pages/PetRegisterPage';
import TutorPanelPage from '../pages/TutorPanelPage';
import MedicationsPage from '../pages/MedicationsPage';
import MedicationFormPage from '../pages/MedicationFormPage';
import MedicationStockPage from '../pages/MedicationStockPage';
import StockBatchFormPage from '../pages/StockBatchFormPage';
import ProceduresPage from '../pages/ProceduresPage';
import ProcedureFormPage from '../pages/ProcedureFormPage';
import ProcedureDetailPage from '../pages/ProcedureDetailPage';
import DocumentsPage from '../pages/DocumentsPage';
import ClinicPage from '../pages/ClinicPage';
import AtendimentosPage from '../pages/AtendimentosPage';
import AtendimentoFormPage from '../pages/AtendimentoFormPage';
import AtendimentoDetailPage from '../pages/AtendimentoDetailPage';

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, index: true },
  { path: '/clinica', element: <ClinicPage /> },
  { path: '/clientes', element: <CustomersPage /> },
  { path: '/clientes/novo', element: <CustomerFormPage /> },
  { path: '/clientes/:id/editar', element: <CustomerFormPage /> },
  { path: '/pets', element: <PetsPage /> },
  { path: '/pets/novo', element: <PetFormPage /> },
  { path: '/pets/:id/editar', element: <PetFormPage /> },
  { path: '/funcionarios', element: <EmployeesPage /> },
  { path: '/funcionarios/novo', element: <EmployeeFormPage /> },
  { path: '/funcionarios/:id/editar', element: <EmployeeFormPage /> },
  { path: '/cadastro-pet', element: <PetRegisterPage /> },
  { path: '/painel-tutor', element: <TutorPanelPage /> },
  { path: '/medicamentos', element: <MedicationsPage /> },
  { path: '/medicamentos/novo', element: <MedicationFormPage /> },
  { path: '/medicamentos/:id/editar', element: <MedicationFormPage /> },
  { path: '/medicamentos/:id/estoque', element: <MedicationStockPage /> },
  { path: '/medicamentos/:id/estoque/novo', element: <StockBatchFormPage /> },
  { path: '/procedimentos', element: <ProceduresPage /> },
  { path: '/procedimentos/novo', element: <ProcedureFormPage /> },
  { path: '/procedimentos/:id', element: <ProcedureDetailPage /> },
  { path: '/documentos', element: <DocumentsPage /> },
  { path: '/atendimentos', element: <AtendimentosPage /> },
  { path: '/atendimentos/novo', element: <AtendimentoFormPage /> },
  { path: '/atendimentos/:id', element: <AtendimentoDetailPage /> },
];
