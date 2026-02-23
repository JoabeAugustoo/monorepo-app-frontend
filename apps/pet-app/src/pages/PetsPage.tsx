import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  PersonSearch as TutorPanelIcon,
  Description as DocumentsIcon,
  LocalHospital as AtendimentoIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { FaDog, FaCat, FaDove, FaFrog, FaPaw, FaMars, FaVenus, FaGenderless } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce } from '@app/core';
import { petService } from '../services';
import type { Pet, PetSpecies, PetGender, SearchRequest } from '../types';

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

const SPECIES_ICONS: Record<PetSpecies, React.ReactNode> = {
  DOG: <FaDog />,
  CAT: <FaCat />,
  BIRD: <FaDove />,
  REPTILE: <FaFrog />,
  OTHER: <FaPaw />,
};

const GENDER_LABELS: Record<PetGender, string> = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
  UNKNOWN: 'Indefinido',
};

const GENDER_ICONS: Record<PetGender, React.ReactNode> = {
  MALE: <FaMars />,
  FEMALE: <FaVenus />,
  UNKNOWN: <FaGenderless />,
};

const GENDER_COLORS: Record<PetGender, string> = {
  MALE: '#7EB3E0',
  FEMALE: '#F48FB1',
  UNKNOWN: '#BDBDBD',
};

const PetsPage = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPets, setSelectedPets] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('active');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const columns: DataGridColumn<Pet>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (pet) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(pet.species ? SPECIES_COLORS[pet.species] : '#9e9e9e', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: pet.species ? SPECIES_COLORS[pet.species] : '#9e9e9e', fontSize: 16, flexShrink: 0 }}>
            {pet.species ? SPECIES_ICONS[pet.species] : <PetsIcon sx={{ fontSize: 16 }} />}
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">{pet.name}</Typography>
        </Box>
      ),
    },
    {
      key: 'species',
      header: 'Espécie',
      sortable: true,
      render: (pet) => pet.species ? (
        <Chip
          icon={<span style={{ color: SPECIES_COLORS[pet.species], display: 'flex', fontSize: 14 }}>{SPECIES_ICONS[pet.species]}</span>}
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
    { key: 'breed', header: 'Raça', render: (pet) => (
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>{pet.breed || '-'}</Typography>
    ) },
    {
      key: 'gender',
      header: 'Sexo',
      render: (pet) => pet.gender ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: GENDER_COLORS[pet.gender], display: 'flex' }}>{GENDER_ICONS[pet.gender]}</span>
          {GENDER_LABELS[pet.gender]}
        </span>
      ) : '-',
    },
    {
      key: 'primaryTutorName',
      header: 'Tutor',
      render: (pet) => pet.primaryTutorName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PersonIcon sx={{ fontSize: 14, color: '#7EB3E0', opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{pet.primaryTutorName}</Typography>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">-</Typography>,
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pets/novo')}>
        Novo Pet
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <TutorPanelIcon fontSize="small" />,
      tooltip: 'Painel do Tutor',
      onClick: (pet: Pet) => {
        if (pet.primaryTutorCpf) {
          navigate('/painel-tutor', { state: { cpf: pet.primaryTutorCpf } });
        } else {
          toast.info('Pet sem tutor associado.');
        }
      },
      color: 'secondary',
    },
    {
      icon: <DocumentsIcon fontSize="small" />,
      tooltip: 'Documentos',
      onClick: (pet: Pet) => {
        if (pet.primaryTutorCpf) {
          navigate('/documentos', { state: { cpf: pet.primaryTutorCpf, petId: pet.publicId } });
        } else {
          toast.info('Pet sem tutor associado.');
        }
      },
      color: 'info',
    },
    {
      icon: <AtendimentoIcon fontSize="small" />,
      tooltip: 'Iniciar Atendimento',
      onClick: (pet: Pet) => {
        const params = new URLSearchParams({ petId: pet.publicId || '' });
        if (pet.primaryTutorId) params.set('customerId', pet.primaryTutorId);
        else if (pet.primaryTutorCpf) params.set('cpf', pet.primaryTutorCpf);
        navigate(`/atendimentos/novo?${params}`);
      },
      color: 'success',
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (pet: Pet) => navigate(`/pets/${pet.publicId}/editar`),
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
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)',
            flexShrink: 0,
          }}
        >
          <PetsIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            Pets
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Pacientes cadastrados na clínica
          </Typography>
        </Box>
      </Box>

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
        onRefresh={fetchPets}
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
        sx={{ borderRadius: 3, overflow: 'hidden' }}
      />

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
    </Box>
  );
};

export default PetsPage;
