import Dashboard from '@mui/icons-material/Dashboard';
import Pets from '@mui/icons-material/Pets';
import People from '@mui/icons-material/People';
import Badge from '@mui/icons-material/Badge';
import AddCircle from '@mui/icons-material/AddCircle';
import PersonSearch from '@mui/icons-material/PersonSearch';
import Medication from '@mui/icons-material/Medication';
import MedicalServices from '@mui/icons-material/MedicalServices';
import { MenuItem } from '@app/core';

export const menuItems: MenuItem[] = [
  { label: 'Painel', icon: <Dashboard />, path: '/' },
  { label: 'Cadastro Pet', icon: <AddCircle />, path: '/cadastro-pet' },
  { label: 'Painel Tutor', icon: <PersonSearch />, path: '/painel-tutor' },
  { label: 'Clientes', icon: <People />, path: '/clientes' },
  { label: 'Pets', icon: <Pets />, path: '/pets' },
  { label: 'Funcionários', icon: <Badge />, path: '/funcionarios' },
  { label: 'Medicamentos', icon: <Medication />, path: '/medicamentos' },
  { label: 'Procedimentos', icon: <MedicalServices />, path: '/procedimentos' },
];
