'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Exercicio } from '@/types';
import { Search, Plus, Filter, X } from 'lucide-react';

const CATEGORIAS = [
  'peito', 'costas', 'pernas', 'ombros', 'braços', 'abdômen', 'cardio'
];

const EQUIPAMENTOS = [
  'halteres', 'barra', 'máquina', 'peso corporal', 'elástico', 'kettlebell'
];

export default function BibliotecaPage() {
  const router = useRouter();
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [exerciciosFiltrados, setExerciciosFiltrados] = useState<Exercicio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [equipamentoFiltro, setEquipamentoFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadExercicios();
  }, []);

  useEffect(() => {
    filtrarExercicios();
  }, [searchTerm, categoriaFiltro, equipamentoFiltro, exercicios]);

  async function loadExercicios() {
    try {
      const { data, error } = await supabase
        .from('exercicios')
        .select('*')
        .order('nome');

      if (error) throw error;
      setExercicios(data || []);
    } catch (error) {
      console.error('Error loading exercicios:', error);
    } finally {
      setLoading(false);
    }
  }

  function filtrarExercicios() {
    let filtrados = exercicios;

    // Filter by search term
    if (searchTerm) {
      filtrados = filtrados.filter(ex => 
        ex.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoriaFiltro) {
      filtrados = filtrados.filter(ex => ex.categoria === categoriaFiltro);
    }

    // Filter by equipment
    if (equipamentoFiltro) {
      filtrados = filtrados.filter(ex => 
        ex.equipamentos_necessarios?.includes(equipamentoFiltro)
      );
    }

    setExerciciosFiltrados(filtrados);
  }

  function clearFilters() {
    setSearchTerm('');
    setCategoriaFiltro('');
    setEquipamentoFiltro('');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Biblioteca de Exercícios</h1>
            <p className="mt-2 text-text-secondary">
              {exercicios.length} exercícios disponíveis
            </p>
          </div>
          <button
            onClick={() => router.push('/personal/biblioteca/novo')}
            className="mt-4 md:mt-0 btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Exercício</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Filtros</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary-dark transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIAS.map(categoria => (
                      <button
                        key={categoria}
                        onClick={() => setCategoriaFiltro(categoriaFiltro === categoria ? '' : categoria)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          categoriaFiltro === categoria
                            ? 'bg-primary text-white'
                            : 'bg-bg-dark text-text-secondary hover:bg-primary/20'
                        }`}
                      >
                        {categoria}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Equipamento
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPAMENTOS.map(equipamento => (
                      <button
                        key={equipamento}
                        onClick={() => setEquipamentoFiltro(equipamentoFiltro === equipamento ? '' : equipamento)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          equipamentoFiltro === equipamento
                            ? 'bg-secondary text-white'
                            : 'bg-bg-dark text-text-secondary hover:bg-secondary/20'
                        }`}
                      >
                        {equipamento}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-text-secondary">
            {exerciciosFiltrados.length} resultado(s) encontrado(s)
          </p>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {exerciciosFiltrados.map((exercicio) => (
            <div
              key={exercicio.id}
              className="card-neon hover:scale-105 transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/personal/biblioteca/${exercicio.id}`)}
            >
              {/* Exercise Image/GIF */}
              {exercicio.gif_url ? (
                <div className="aspect-video rounded-lg overflow-hidden mb-4">
                  <img
                    src={exercicio.gif_url}
                    alt={exercicio.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-bg-dark rounded-lg flex items-center justify-center mb-4">
                  <div className="text-4xl">🏋️</div>
                </div>
              )}

              {/* Exercise Info */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {exercicio.nome}
                </h3>
                <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
                  <span className="capitalize">{exercicio.categoria}</span>
                  {exercicio.eh_customizado && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
                
                {/* Muscles */}
                {exercicio.musculos_envolvidos && exercicio.musculos_envolvidos.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {exercicio.musculos_envolvidos.slice(0, 3).map((musculo, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-bg-dark text-text-secondary px-2 py-1 rounded"
                      >
                        {musculo}
                      </span>
                    ))}
                    {exercicio.musculos_envolvidos.length > 3 && (
                      <span className="text-xs text-text-secondary">
                        +{exercicio.musculos_envolvidos.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Equipment */}
                {exercicio.equipamentos_necessarios && exercicio.equipamentos_necessarios.length > 0 && (
                  <div className="text-xs text-text-secondary">
                    🏋️ {exercicio.equipamentos_necessarios.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {exerciciosFiltrados.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              Nenhum exercício encontrado
            </h3>
            <p className="text-text-secondary mb-4">
              Tente ajustar seus filtros ou busca
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}