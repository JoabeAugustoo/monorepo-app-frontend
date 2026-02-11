import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { usePets } from '../context/PetContext';
import { Especie } from '../types/pet';

const especieCores: Record<Especie, string> = {
  Cao: '#1B5E20',
  Gato: '#E65100',
  Ave: '#1565C0',
  Outro: '#6A1B9A',
};

export default function PetList() {
  const navigate = useNavigate();
  const { pets, removerPet } = usePets();
  const [busca, setBusca] = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState<string>('');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [petParaExcluir, setPetParaExcluir] = useState<string | null>(null);

  const petsFiltrados = useMemo(() => {
    return pets.filter((pet) => {
      const matchBusca =
        pet.nome.toLowerCase().includes(busca.toLowerCase()) ||
        pet.nomeTutor.toLowerCase().includes(busca.toLowerCase()) ||
        pet.raca.toLowerCase().includes(busca.toLowerCase());
      const matchEspecie = filtroEspecie === '' || pet.especie === filtroEspecie;
      return matchBusca && matchEspecie;
    });
  }, [pets, busca, filtroEspecie]);

  const handleConfirmarExclusao = (id: string) => {
    setPetParaExcluir(id);
    setDialogAberto(true);
  };

  const handleExcluir = () => {
    if (petParaExcluir) {
      removerPet(petParaExcluir);
    }
    setDialogAberto(false);
    setPetParaExcluir(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Pets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pets/novo')}
        >
          Novo Pet
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Buscar por nome, tutor ou raca..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Especie</InputLabel>
          <Select
            value={filtroEspecie}
            label="Especie"
            onChange={(e) => setFiltroEspecie(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="Cao">Cao</MenuItem>
            <MenuItem value="Gato">Gato</MenuItem>
            <MenuItem value="Ave">Ave</MenuItem>
            <MenuItem value="Outro">Outro</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Especie</TableCell>
              <TableCell>Raca</TableCell>
              <TableCell>Idade</TableCell>
              <TableCell>Tutor</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell align="right">Acoes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {petsFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhum pet encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              petsFiltrados.map((pet) => (
                <TableRow key={pet.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{pet.nome}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={pet.especie}
                      size="small"
                      sx={{
                        backgroundColor: especieCores[pet.especie] + '14',
                        color: especieCores[pet.especie],
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>{pet.raca}</TableCell>
                  <TableCell>{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</TableCell>
                  <TableCell>{pet.nomeTutor}</TableCell>
                  <TableCell>{pet.telefoneTutor}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/pets/${pet.id}/editar`)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleConfirmarExclusao(pet.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)}>
        <DialogTitle>Confirmar exclusao</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este pet? Esta acao nao pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button onClick={handleExcluir} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
