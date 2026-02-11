import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { usePets } from '../context/PetContext';
import { totalPets, contarPorEspecie, cadastrosRecentes, mediaIdade } from '../mocks/dashboard';
import { Especie } from '../types/pet';

const especieCores: Record<Especie, string> = {
  Cao: '#1B5E20',
  Gato: '#E65100',
  Ave: '#1565C0',
  Outro: '#6A1B9A',
};

export default function Dashboard() {
  const { pets } = usePets();
  const total = totalPets(pets);
  const porEspecie = contarPorEspecie(pets);
  const recentes = cadastrosRecentes(pets);
  const media = mediaIdade(pets);

  const cards = [
    { titulo: 'Total de Pets', valor: total, icone: <PetsIcon />, cor: '#1B5E20' },
    { titulo: 'Caes', valor: porEspecie.Cao, icone: <PetsIcon />, cor: '#2E7D32' },
    { titulo: 'Gatos', valor: porEspecie.Gato, icone: <PetsIcon />, cor: '#E65100' },
    { titulo: 'Media de Idade', valor: `${media} anos`, icone: <AccessTimeIcon />, cor: '#1565C0' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Painel
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.titulo}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.titulo}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {card.valor}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: card.cor + '14',
                      color: card.cor,
                    }}
                  >
                    {card.icone}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        Cadastros Recentes
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Especie</TableCell>
              <TableCell>Raca</TableCell>
              <TableCell>Tutor</TableCell>
              <TableCell>Data Cadastro</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentes.map((pet) => (
              <TableRow key={pet.id}>
                <TableCell><Typography fontWeight={600} variant="body2">{pet.nome}</Typography></TableCell>
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
                <TableCell>{pet.nomeTutor}</TableCell>
                <TableCell>
                  {new Date(pet.dataCadastro).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
