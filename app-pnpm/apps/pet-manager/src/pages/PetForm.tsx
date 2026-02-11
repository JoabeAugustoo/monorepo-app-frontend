import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid2 as Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { usePets } from '../context/PetContext';
import { Especie, Sexo, Vacina } from '../types/pet';

interface FormData {
  nome: string;
  especie: Especie;
  raca: string;
  idade: number;
  sexo: Sexo;
  nomeTutor: string;
  telefoneTutor: string;
  emailTutor: string;
  vacinas: Vacina[];
  peso: number;
  observacoes: string;
}

const formInicial: FormData = {
  nome: '',
  especie: 'Cao',
  raca: '',
  idade: 0,
  sexo: 'Macho',
  nomeTutor: '',
  telefoneTutor: '',
  emailTutor: '',
  vacinas: [],
  peso: 0,
  observacoes: '',
};

export default function PetForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { adicionarPet, atualizarPet, buscarPetPorId } = usePets();
  const editando = Boolean(id);

  const [form, setForm] = useState<FormData>(formInicial);

  useEffect(() => {
    if (id) {
      const pet = buscarPetPorId(id);
      if (pet) {
        setForm({
          nome: pet.nome,
          especie: pet.especie,
          raca: pet.raca,
          idade: pet.idade,
          sexo: pet.sexo,
          nomeTutor: pet.nomeTutor,
          telefoneTutor: pet.telefoneTutor,
          emailTutor: pet.emailTutor,
          vacinas: pet.vacinas,
          peso: pet.peso,
          observacoes: pet.observacoes,
        });
      }
    }
  }, [id, buscarPetPorId]);

  const handleChange = (campo: keyof FormData, valor: unknown) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAdicionarVacina = () => {
    setForm((prev) => ({
      ...prev,
      vacinas: [...prev.vacinas, { nome: '', data: '' }],
    }));
  };

  const handleRemoverVacina = (index: number) => {
    setForm((prev) => ({
      ...prev,
      vacinas: prev.vacinas.filter((_, i) => i !== index),
    }));
  };

  const handleVacinaChange = (index: number, campo: keyof Vacina, valor: string) => {
    setForm((prev) => ({
      ...prev,
      vacinas: prev.vacinas.map((v, i) => (i === index ? { ...v, [campo]: valor } : v)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editando && id) {
      atualizarPet(id, form);
    } else {
      adicionarPet(form);
    }
    navigate('/pets');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/pets')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {editando ? 'Editar Pet' : 'Novo Pet'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        {/* Secao Basico */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Informacoes Basicas
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nome"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Especie</InputLabel>
                  <Select
                    value={form.especie}
                    label="Especie"
                    onChange={(e) => handleChange('especie', e.target.value)}
                  >
                    <MenuItem value="Cao">Cao</MenuItem>
                    <MenuItem value="Gato">Gato</MenuItem>
                    <MenuItem value="Ave">Ave</MenuItem>
                    <MenuItem value="Outro">Outro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Raca"
                  value={form.raca}
                  onChange={(e) => handleChange('raca', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Idade"
                  type="number"
                  value={form.idade}
                  onChange={(e) => handleChange('idade', Number(e.target.value))}
                  fullWidth
                  required
                  slotProps={{ htmlInput: { min: 0 } }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <FormControl fullWidth required>
                  <InputLabel>Sexo</InputLabel>
                  <Select
                    value={form.sexo}
                    label="Sexo"
                    onChange={(e) => handleChange('sexo', e.target.value)}
                  >
                    <MenuItem value="Macho">Macho</MenuItem>
                    <MenuItem value="Femea">Femea</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Secao Tutor */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Dados do Tutor
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nome do Tutor"
                  value={form.nomeTutor}
                  onChange={(e) => handleChange('nomeTutor', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Telefone"
                  value={form.telefoneTutor}
                  onChange={(e) => handleChange('telefoneTutor', e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={form.emailTutor}
                  onChange={(e) => handleChange('emailTutor', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Secao Saude */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Saude
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Peso (kg)"
                  type="number"
                  value={form.peso}
                  onChange={(e) => handleChange('peso', Number(e.target.value))}
                  fullWidth
                  slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Observacoes"
                  value={form.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Vacinas
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAdicionarVacina}
              >
                Adicionar Vacina
              </Button>
            </Box>

            {form.vacinas.map((vacina, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    label="Nome da Vacina"
                    value={vacina.nome}
                    onChange={(e) => handleVacinaChange(index, 'nome', e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 10, sm: 5 }}>
                  <TextField
                    label="Data"
                    type="date"
                    value={vacina.data}
                    onChange={(e) => handleVacinaChange(index, 'data', e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 2 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleRemoverVacina(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {form.vacinas.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhuma vacina cadastrada
              </Typography>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate('/pets')}>
            Cancelar
          </Button>
          <Button variant="contained" type="submit">
            {editando ? 'Salvar Alteracoes' : 'Cadastrar Pet'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
