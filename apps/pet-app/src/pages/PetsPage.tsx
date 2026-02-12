import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  Chip,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { petService, customerService } from '../services';
import type { Pet, PetDto, PetSpecies, PetGender, Customer, SearchRequest } from '../types';

const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: 'Cão',
  CAT: 'Gato',
  BIRD: 'Ave',
  REPTILE: 'Réptil',
  OTHER: 'Outro',
};

const SPECIES_COLORS: Record<PetSpecies, string> = {
  DOG: '#9C72D9',
  CAT: '#F48FB1',
  BIRD: '#81C9C5',
  REPTILE: '#7EB3E0',
  OTHER: '#FFD6A5',
};

const GENDER_LABELS: Record<PetGender, string> = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
  UNKNOWN: 'Indefinido',
};

interface PetFormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: PetGender | '';
  birthDate: string;
  weight: string;
  color: string;
  observations: string;
  primaryTutorId: string;
}

const initialFormData: PetFormData = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  birthDate: '',
  weight: '',
  color: '',
  observations: '',
  primaryTutorId: '',
};

const PetsPage = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPets, setSelectedPets] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PetFormData>(initialFormData);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [sortField, setSortField] = useState('active');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    customerService.getActiveCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (searchTerm.trim()) {
        searchRequest.where = { name: { contains: searchTerm.trim() } };
      }

      const response = await petService.searchPets(searchRequest);
      if (response?.data) {
        setPets(response.data);
        setTotalItems(response.total || 0);
      } else {
        setPets([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar pets:', error);
      setPets([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name || '',
      species: pet.species || '',
      breed: pet.breed || '',
      gender: pet.gender || '',
      birthDate: pet.birthDate || '',
      weight: pet.weight?.toString() || '',
      color: pet.color || '',
      observations: pet.observations || '',
      primaryTutorId: pet.primaryTutorId || '',
    });
    setShowForm(true);
  };

  const handleDelete = (pet: Pet) => {
    setPetToDelete(pet);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!petToDelete?.publicId) return;
    try {
      setIsInactivating(true);
      await petService.deactivatePet(petToDelete.publicId);
      toast.success(`Pet "${petToDelete.name}" foi inativado com sucesso!`);
      setShowDeleteModal(false);
      setPetToDelete(null);
      fetchPets();
    } catch (error) {
      console.error('Erro ao inativar pet:', error);
    } finally {
      setIsInactivating(false);
    }
  };

  const handleAddNew = () => {
    setEditingPet(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const petData: PetDto = {
        name: formData.name,
        species: formData.species as PetSpecies || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender as PetGender || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        color: formData.color || undefined,
        observations: formData.observations || undefined,
        primaryTutorId: formData.primaryTutorId || undefined,
      };

      if (editingPet?.publicId) {
        await petService.updatePet(editingPet.publicId, petData);
        toast.success('Pet atualizado com sucesso!');
      } else {
        await petService.createPet(petData);
        toast.success('Pet criado com sucesso!');
      }

      setShowForm(false);
      setCurrentPage(1);
      fetchPets();
    } catch (error) {
      console.error('Erro ao salvar pet:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Pet>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (pet) => (
        <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PetsIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          {pet.name}
        </div>
      ),
    },
    {
      key: 'species',
      header: 'Espécie',
      sortable: true,
      render: (pet) => pet.species ? (
        <Chip
          label={SPECIES_LABELS[pet.species] || pet.species}
          size="small"
          sx={{
            backgroundColor: (SPECIES_COLORS[pet.species] || '#455A64') + '14',
            color: SPECIES_COLORS[pet.species] || '#455A64',
            fontWeight: 600,
          }}
        />
      ) : '-',
    },
    { key: 'breed', header: 'Raça', render: (pet) => pet.breed || '-' },
    {
      key: 'gender',
      header: 'Sexo',
      render: (pet) => pet.gender ? GENDER_LABELS[pet.gender] || pet.gender : '-',
    },
    {
      key: 'primaryTutorName',
      header: 'Tutor',
      render: (pet) => pet.primaryTutorName || '-',
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (pet) => <StatusChip active={pet.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar pets..."
      />
      {selectedPets.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={async () => {
            const count = selectedPets.length;
            if (window.confirm(`Tem certeza que deseja inativar ${count} pet${count > 1 ? 's' : ''}?`)) {
              await Promise.all(selectedPets.map((id) => petService.deactivatePet(String(id))));
              toast.success(`${count} pet${count > 1 ? 's inativados' : ' inativado'} com sucesso!`);
              setSelectedPets([]);
              fetchPets();
            }
          }}
        >
          Inativar ({selectedPets.length})
        </Button>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
        Novo Pet
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (pet: Pet) => handleEdit(pet),
      color: 'primary',
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Inativar',
      onClick: (pet: Pet) => handleDelete(pet),
      color: 'error',
    },
  ];

  return (
    <>
      <DataGrid<Pet>
        data={pets}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum pet cadastrado"
        onSelectionChange={setSelectedPets}
        loading={loading}
        serverSidePagination
        page={currentPage}
        totalRows={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        sortField={sortField}
        sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
          setCurrentPage(1);
        }}
      />

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title={editingPet ? 'Editar Pet' : 'Novo Pet'}
        titleIcon={<PetsIcon sx={{ color: '#9C72D9' }} />}
        submitLabel={loading ? 'Salvando...' : editingPet ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField fullWidth label="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              select
              label="Espécie"
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value as PetSpecies | '' })}
            >
              <MuiMenuItem value="">Selecione...</MuiMenuItem>
              {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Raça" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              select
              label="Sexo"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as PetGender | '' })}
            >
              <MuiMenuItem value="">Selecione...</MuiMenuItem>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Cor" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Data de Nascimento"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              fullWidth
              label="Peso (kg)"
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              slotProps={{ input: { inputProps: { step: '0.1', min: '0' } } }}
            />
          </Box>
          <TextField
            fullWidth
            select
            label="Tutor Principal"
            value={formData.primaryTutorId}
            onChange={(e) => setFormData({ ...formData, primaryTutorId: e.target.value })}
          >
            <MuiMenuItem value="">Nenhum</MuiMenuItem>
            {customers.map((c) => (
              <MuiMenuItem key={c.publicId || c.id} value={c.publicId || c.id || ''}>
                {c.name}
              </MuiMenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Observações"
            multiline
            rows={3}
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          />
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setPetToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Inativação"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar este pet?"
        confirmLabel="Inativar Pet"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O pet será marcado como inativo."
      >
        {petToDelete && (
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {petToDelete.name}
            </Typography>
            {petToDelete.species && (
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {SPECIES_LABELS[petToDelete.species] || petToDelete.species}
                {petToDelete.breed ? ` - ${petToDelete.breed}` : ''}
              </Typography>
            )}
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default PetsPage;
