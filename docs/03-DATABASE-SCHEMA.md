# Schema do Banco de Dados - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento descreve o schema completo do banco de dados PostgreSQL para o Sistema PWA de Gerenciamento de Treinos. O schema é otimizado para performance, segurança e escalabilidade, utilizando as melhores práticas do Supabase e PostgreSQL 14.

## 2. ESTRUTURA DO SCHEMA

### 2.1. Schema Principal: `app`

Todo o schema da aplicação está contido dentro do schema `app` para melhor organização e segurança.

```sql
-- Criar schema da aplicação
CREATE SCHEMA IF NOT EXISTS app;

-- Configurar permissões
GRANT USAGE ON SCHEMA app TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA app TO authenticated, service_role;
```

### 2.2. Extensões Necessárias

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 3. TABELAS DO SISTEMA

### 3.1. Tabela: `users`

Tabela central que armazena todos os usuários do sistema (Personal Trainers e Alunos).

```sql
-- Tabela de usuários
CREATE TABLE app.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    user_type TEXT CHECK (user_type IN ('trainer', 'student')) NOT NULL,
    full_name TEXT NOT NULL,
    profile_photo_url TEXT,
    phone TEXT,
    
    -- Dados específicos para Personal Trainers
    specialties TEXT[] DEFAULT '{}',
    bio TEXT,
    
    -- Dados específicos para Alunos
    goal TEXT CHECK (goal IN ('perda_peso', 'ganho_massa', 'condicionamento', 'saude_geral')),
    injuries_restrictions TEXT,
    birth_date DATE,
    
    -- Controle de status
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) NOT NULL DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Índices para performance
    CONSTRAINT users_email_idx UNIQUE (email),
    CONSTRAINT users_user_type_idx INDEX (user_type),
    CONSTRAINT users_status_idx INDEX (status)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON app.users
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices adicionais
CREATE INDEX idx_users_email ON app.users(email);
CREATE INDEX idx_users_user_type ON app.users(user_type);
CREATE INDEX idx_users_status ON app.users(status);
```

#### 3.1.1. Políticas de RLS para `users`

```sql
-- Habilitar RLS
ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view their own profile" ON app.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON app.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Trainers can view their students" ON app.users
    FOR SELECT USING (
        user_type = 'student' AND 
        EXISTS (
            SELECT 1 FROM app.trainer_students 
            WHERE trainer_id = auth.uid() 
            AND student_id = users.id
            AND status = 'active'
        )
    );
```

### 3.2. Tabela: `trainer_students`

Tabela de relacionamento entre Personal Trainers e seus alunos.

```sql
-- Tabela de relacionamento PT-Aluno
CREATE TABLE app.trainer_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Token de convite
    invite_token TEXT UNIQUE,
    invite_code TEXT UNIQUE, -- Código de 6 dígitos para convite
    
    -- Controle do convite
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours',
    
    -- Status do relacionamento
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive', 'expired')) DEFAULT 'pending',
    
    -- Metadados
    invited_by UUID REFERENCES app.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(trainer_id, student_id),
    CHECK (trainer_id != student_id)
);

-- Trigger para updated_at
CREATE TRIGGER update_trainer_students_updated_at BEFORE UPDATE ON app.trainer_students
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_trainer_students_trainer ON app.trainer_students(trainer_id);
CREATE INDEX idx_trainer_students_student ON app.trainer_students(student_id);
CREATE INDEX idx_trainer_students_status ON app.trainer_students(status);
CREATE INDEX idx_trainer_students_invite_token ON app.trainer_students(invite_token);
CREATE INDEX idx_trainer_students_invite_code ON app.trainer_students(invite_code);
```

#### 3.2.1. Políticas de RLS para `trainer_students`

```sql
-- Habilitar RLS
ALTER TABLE app.trainer_students ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Trainers and students can see their relationships" ON app.trainer_students
    FOR SELECT USING (auth.uid() = trainer_id OR auth.uid() = student_id);

CREATE POLICY "Trainers can create invitations" ON app.trainer_students
    FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their invitations" ON app.trainer_students
    FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Students can accept invitations" ON app.trainer_students
    FOR UPDATE USING (
        auth.uid() = student_id AND 
        status = 'pending' AND 
        expires_at > now()
    );
```

### 3.3. Tabela: `exercises`

Biblioteca de exercícios personalizada por Personal Trainer.

```sql
-- Tabela de exercícios
CREATE TABLE app.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Categorização
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT CHECK (equipment IN ('none', 'dumbbell', 'barbell', 'machine', 'cable', 'band', 'bodyweight')),
    exercise_type TEXT CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'balance')),
    
    -- Dificuldade e execução
    difficulty TEXT NOT NULL CHECK (difficulty IN ('iniciante', 'intermediário', 'avançado')),
    duration_seconds INTEGER,
    
    -- Mídias
    video_urls TEXT[] DEFAULT '{}',
    image_urls TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    
    -- Metadados
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Controle
    status TEXT CHECK (status IN ('active', 'inactive')) NOT NULL DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Índices
    CONSTRAINT exercises_trainer_name_idx UNIQUE (trainer_id, name)
);

-- Trigger para updated_at
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON app.exercises
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_exercises_trainer ON app.exercises(trainer_id);
CREATE INDEX idx_exercises_muscle_groups ON app.exercises USING GIN(muscle_groups);
CREATE INDEX idx_exercises_difficulty ON app.exercises(difficulty);
CREATE INDEX idx_exercises_status ON app.exercises(status);
CREATE INDEX idx_exercises_name ON app.exercises(name);
```

#### 3.3.1. Políticas de RLS para `exercises`

```sql
-- Habilitar RLS
ALTER TABLE app.exercises ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Trainers can manage their own exercises" ON app.exercises
    FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Students can view exercises from their trainers" ON app.exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.trainer_students 
            WHERE student_id = auth.uid() 
            AND trainer_id = app.exercises.trainer_id
            AND status = 'active'
        )
    );

CREATE POLICY "Students can view public exercises" ON app.exercises
    FOR SELECT USING (is_public = TRUE);
```

### 3.4. Tabela: `workouts`

Treinos criados pelos Personal Trainers.

```sql
-- Tabela de treinos
CREATE TABLE app.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name TEXT NOT NULL,
    description TEXT,
    
    -- Categorização
    workout_type TEXT CHECK (workout_type IN ('strength', 'cardio', 'hiit', 'functional', 'mixed')),
    difficulty TEXT CHECK (difficulty IN ('iniciante', 'intermediário', 'avançado')),
    
    -- Duração estimada
    estimated_duration_minutes INTEGER,
    
    -- Metadados
    tags TEXT[] DEFAULT '{}',
    
    -- Controle
    status TEXT CHECK (status IN ('draft', 'active', 'archived')) NOT NULL DEFAULT 'draft',
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Índices
    CONSTRAINT workouts_trainer_name_idx UNIQUE (trainer_id, name)
);

-- Trigger para updated_at
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON app.workouts
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_workouts_trainer ON app.workouts(trainer_id);
CREATE INDEX idx_workouts_status ON app.workouts(status);
CREATE INDEX idx_workouts_type ON app.workouts(workout_type);
```

#### 3.4.1. Políticas de RLS para `workouts`

```sql
-- Habilitar RLS
ALTER TABLE app.workouts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Trainers can manage their own workouts" ON app.workouts
    FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Students can view assigned workouts" ON app.workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.workout_assignments 
            WHERE student_id = auth.uid() 
            AND workout_id = app.workouts.id
            AND status = 'active'
        )
    );
```

### 3.5. Tabela: `workout_exercises`

Relacionamento entre treinos e exercícios (exercícios dentro de um treino).

```sql
-- Tabela de exercícios dentro dos treinos
CREATE TABLE app.workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES app.workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES app.exercises(id) ON DELETE CASCADE,
    
    -- Ordem de execução
    "order" INTEGER NOT NULL,
    
    -- Configurações do exercício no treino
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT NOT NULL, -- e.g., '8-12', '15', 'at_falha'
    rest_time_seconds INTEGER NOT NULL DEFAULT 60,
    suggested_weight_kg NUMERIC(5,2),
    
    -- Instruções específicas para este exercício neste treino
    notes TEXT,
    
    -- Modificações/variações
    modifications TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(workout_id, exercise_id, "order"),
    UNIQUE(workout_id, "order")
);

-- Trigger para updated_at
CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON app.workout_exercises
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_workout_exercises_workout ON app.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise ON app.workout_exercises(exercise_id);
```

#### 3.5.1. Políticas de RLS para `workout_exercises`

```sql
-- Habilitar RLS
ALTER TABLE app.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view workout exercises" ON app.workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.workouts 
            WHERE id = workout_exercises.workout_id
            AND (
                trainer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM app.workout_assignments 
                    WHERE workout_id = workout_exercises.workout_id
                    AND student_id = auth.uid()
                    AND status = 'active'
                )
            )
        )
    );

CREATE POLICY "Trainers can manage workout exercises" ON app.workout_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app.workouts 
            WHERE id = workout_exercises.workout_id 
            AND trainer_id = auth.uid()
        )
    );
```

### 3.6. Tabela: `workout_assignments`

Atribuição de treinos aos alunos.

```sql
-- Tabela de atribuição de treinos
CREATE TABLE app.workout_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES app.workouts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Período de vigência
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Frequência (dias da semana)
    frequency_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Domingo, 1=Segunda, etc.
    
    -- Status
    status TEXT CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) NOT NULL DEFAULT 'active',
    
    -- Metadados
    assigned_by UUID NOT NULL REFERENCES app.users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(workout_id, student_id, start_date)
);

-- Trigger para updated_at
CREATE TRIGGER update_workout_assignments_updated_at BEFORE UPDATE ON app.workout_assignments
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_workout_assignments_workout ON app.workout_assignments(workout_id);
CREATE INDEX idx_workout_assignments_student ON app.workout_assignments(student_id);
CREATE INDEX idx_workout_assignments_status ON app.workout_assignments(status);
CREATE INDEX idx_workout_assignments_dates ON app.workout_assignments(start_date, end_date);
```

#### 3.6.1. Políticas de RLS para `workout_assignments`

```sql
-- Habilitar RLS
ALTER TABLE app.workout_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Trainers and students can view assignments" ON app.workout_assignments
    FOR SELECT USING (
        auth.uid() = student_id OR 
        EXISTS (
            SELECT 1 FROM app.workouts 
            WHERE id = workout_assignments.workout_id 
            AND trainer_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can create assignments" ON app.workout_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM app.workouts 
            WHERE id = workout_assignments.workout_id 
            AND trainer_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can update assignments" ON app.workout_assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM app.workouts 
            WHERE id = workout_assignments.workout_id 
            AND trainer_id = auth.uid()
        )
    );
```

### 3.7. Tabela: `workout_sessions`

Sessões de execução de treino pelos alunos.

```sql
-- Tabela de sessões de treino
CREATE TABLE app.workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES app.workout_assignments(id) ON DELETE CASCADE,
    
    -- Controle de tempo
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Status
    status TEXT CHECK (status IN ('in_progress', 'completed', 'paused', 'cancelled')) NOT NULL DEFAULT 'in_progress',
    
    -- Performance geral
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    notes TEXT,
    
    -- Sincronização
    synced_at TIMESTAMPTZ,
    sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Índices
    UNIQUE(assignment_id, started_at)
);

-- Trigger para updated_at
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON app.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_workout_sessions_assignment ON app.workout_sessions(assignment_id);
CREATE INDEX idx_workout_sessions_started ON app.workout_sessions(started_at);
CREATE INDEX idx_workout_sessions_status ON app.workout_sessions(status);
CREATE INDEX idx_workout_sessions_sync ON app.workout_sessions(sync_status);
```

#### 3.7.1. Políticas de RLS para `workout_sessions`

```sql
-- Habilitar RLS
ALTER TABLE app.workout_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Students can manage their sessions" ON app.workout_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app.workout_assignments 
            WHERE id = workout_sessions.assignment_id 
            AND student_id = auth.uid()
        )
    );

CREATE POLICY "Trainers can view student sessions" ON app.workout_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.workout_assignments wa
            JOIN app.workouts w ON wa.workout_id = w.id
            WHERE wa.id = workout_sessions.assignment_id 
            AND w.trainer_id = auth.uid()
        )
    );
```

### 3.8. Tabela: `session_entries`

Registro de cada série executada em uma sessão de treino.

```sql
-- Tabela de entradas de sessão (séries executadas)
CREATE TABLE app.session_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES app.workout_sessions(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES app.workout_exercises(id) ON DELETE CASCADE,
    
    -- Execução real
    set_number INTEGER NOT NULL,
    reps_performed INTEGER NOT NULL,
    weight_used_kg NUMERIC(5,2),
    
    -- Duração da série
    duration_seconds INTEGER,
    
    -- Percepção de esforço
    perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
    
    -- Notas da execução
    notes TEXT,
    
    -- Form check (análise de forma)
    form_score NUMERIC(3,2) CHECK (form_score >= 0 AND form_score <= 1),
    form_feedback TEXT,
    
    -- Sincronização
    synced_at TIMESTAMPTZ,
    sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed')) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(session_id, workout_exercise_id, set_number)
);

-- Trigger para updated_at
CREATE TRIGGER update_session_entries_updated_at BEFORE UPDATE ON app.session_entries
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_session_entries_session ON app.session_entries(session_id);
CREATE INDEX idx_session_entries_workout_exercise ON app.session_entries(workout_exercise_id);
CREATE INDEX idx_session_entries_sync ON app.session_entries(sync_status);
```

#### 3.8.1. Políticas de RLS para `session_entries`

```sql
-- Habilitar RLS
ALTER TABLE app.session_entries ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Students can manage their entries" ON app.session_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app.workout_sessions ws
            WHERE ws.id = session_entries.session_id
            AND EXISTS (
                SELECT 1 FROM app.workout_assignments wa
                WHERE wa.id = ws.assignment_id
                AND wa.student_id = auth.uid()
            )
        )
    );

CREATE POLICY "Trainers can view student entries" ON app.session_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.workout_sessions ws
            JOIN app.workout_assignments wa ON ws.assignment_id = wa.id
            JOIN app.workouts w ON wa.workout_id = w.id
            WHERE ws.id = session_entries.session_id
            AND w.trainer_id = auth.uid()
        )
    );
```

### 3.9. Tabela: `assessments`

Avaliações físicas realizadas pelos Personal Trainers.

```sql
-- Tabela de avaliações físicas
CREATE TABLE app.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Dados antropométricos
    weight_kg NUMERIC(5,2) NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    body_fat_percentage NUMERIC(4,2),
    
    -- Medidas corporais (JSON para flexibilidade)
    measurements JSONB DEFAULT '{}',
    /* Estrutura esperada:
    {
        "neck": 38.5,
        "chest": 98.0,
        "waist": 82.5,
        "hips": 95.0,
        "bicep_left": 32.0,
        "bicep_right": 32.5,
        "thigh_left": 58.0,
        "thigh_right": 58.5,
        "calf_left": 38.0,
        "calf_right": 38.5
    }
    */
    
    -- Cálculos automáticos (atualizados por trigger)
    bmi NUMERIC(4,2),
    bmi_classification TEXT,
    fat_mass_kg NUMERIC(5,2),
    lean_mass_kg NUMERIC(5,2),
    
    -- Metas e observações
    goals TEXT,
    observations TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'completed', 'archived')) NOT NULL DEFAULT 'draft',
    
    -- Timestamps
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Índices
    UNIQUE(student_id, assessment_date)
);

-- Trigger para cálculos automáticos
CREATE OR REPLACE FUNCTION app.calculate_body_composition()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular IMC
    IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL THEN
        NEW.bmi := NEW.weight_kg / ((NEW.height_cm / 100) ^ 2);
        
        -- Classificar IMC
        IF NEW.bmi < 18.5 THEN
            NEW.bmi_classification := 'Abaixo do peso';
        ELSIF NEW.bmi < 24.9 THEN
            NEW.bmi_classification := 'Peso normal';
        ELSIF NEW.bmi < 29.9 THEN
            NEW.bmi_classification := 'Sobrepeso';
        ELSE
            NEW.bmi_classification := 'Obesidade';
        END IF;
    END IF;
    
    -- Calcular massa gorda e magra
    IF NEW.weight_kg IS NOT NULL AND NEW.body_fat_percentage IS NOT NULL THEN
        NEW.fat_mass_kg := (NEW.body_fat_percentage / 100) * NEW.weight_kg;
        NEW.lean_mass_kg := NEW.weight_kg - NEW.fat_mass_kg;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_body_composition_trigger
    BEFORE INSERT OR UPDATE ON app.assessments
    FOR EACH ROW EXECUTE FUNCTION app.calculate_body_composition();

-- Trigger para updated_at
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON app.assessments
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_assessments_student ON app.assessments(student_id);
CREATE INDEX idx_assessments_trainer ON app.assessments(trainer_id);
CREATE INDEX idx_assessments_date ON app.assessments(assessment_date);
```

#### 3.9.1. Políticas de RLS para `assessments`

```sql
-- Habilitar RLS
ALTER TABLE app.assessments ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Students can view their assessments" ON app.assessments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Trainers can manage their students assessments" ON app.assessments
    FOR ALL USING (
        auth.uid() = trainer_id AND
        EXISTS (
            SELECT 1 FROM app.trainer_students 
            WHERE trainer_id = auth.uid() 
            AND student_id = assessments.student_id
            AND status = 'active'
        )
    );
```

### 3.10. Tabela: `sync_queue`

Fila de sincronização para dados offline.

```sql
-- Tabela de fila de sincronização
CREATE TABLE app.sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    
    -- Tipo de operação
    operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'update', 'delete')),
    
    -- Tabela e registro afetados
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    
    -- Dados da operação
    data JSONB,
    
    -- Controle de processamento
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Erros
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    
    -- Índices
    CONSTRAINT sync_queue_user_status_idx INDEX (user_id, status)
);

-- Trigger para updated_at
CREATE TRIGGER update_sync_queue_updated_at BEFORE UPDATE ON app.sync_queue
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_sync_queue_user ON app.sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON app.sync_queue(status);
CREATE INDEX idx_sync_queue_created ON app.sync_queue(created_at);
```

#### 3.10.1. Políticas de RLS para `sync_queue`

```sql
-- Habilitar RLS
ALTER TABLE app.sync_queue ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their sync queue" ON app.sync_queue
    FOR ALL USING (auth.uid() = user_id);
```

## 4. VIEWS (VISÕES)

### 4.1. View: `active_workouts_today`

```sql
-- View de treinos ativos para hoje
CREATE OR REPLACE VIEW app.active_workouts_today AS
SELECT 
    wa.id as assignment_id,
    wa.workout_id,
    wa.student_id,
    w.name as workout_name,
    w.description as workout_description,
    w.difficulty,
    w.estimated_duration_minutes,
    u.full_name as student_name,
    u.profile_photo_url as student_photo,
    array_agg(
        json_build_object(
            'id', we.id,
            'exercise_id', e.id,
            'name', e.name,
            'order', we.order,
            'sets', we.sets,
            'reps', we.reps,
            'rest_time_seconds', we.rest_time_seconds,
            'suggested_weight_kg', we.suggested_weight_kg,
            'notes', we.notes
        ) ORDER BY we.order
    ) as exercises
FROM app.workout_assignments wa
JOIN app.workouts w ON wa.workout_id = w.id
JOIN app.users u ON wa.student_id = u.id
JOIN app.workout_exercises we ON w.id = we.workout_id
JOIN app.exercises e ON we.exercise_id = e.id
WHERE 
    wa.status = 'active'
    AND wa.start_date <= CURRENT_DATE
    AND (wa.end_date IS NULL OR wa.end_date >= CURRENT_DATE)
    AND EXTRACT(DOW FROM CURRENT_DATE) = ANY(wa.frequency_days)
GROUP BY 
    wa.id, wa.workout_id, wa.student_id, w.name, w.description, 
    w.difficulty, w.estimated_duration_minutes, u.full_name, u.profile_photo_url;
```

### 4.2. View: `student_progress_summary`

```sql
-- View de resumo de progresso do aluno
CREATE OR REPLACE VIEW app.student_progress_summary AS
SELECT 
    u.id as student_id,
    u.full_name as student_name,
    u.profile_photo_url,
    
    -- Estatísticas de treino
    COUNT(DISTINCT ws.id) as total_sessions,
    COUNT(DISTINCT DATE(ws.started_at)) as training_days,
    SUM(ws.duration_seconds) as total_training_time_seconds,
    AVG(ws.duration_seconds) as avg_session_duration_seconds,
    
    -- Estatísticas de exercícios
    COUNT(DISTINCT se.id) as total_sets_completed,
    SUM(se.reps_performed) as total_reps_completed,
    AVG(se.weight_used_kg) as avg_weight_used,
    
    -- Treinos ativos
    COUNT(DISTINCT wa.id) as active_assignments,
    
    -- Última sessão
    MAX(ws.started_at) as last_session_at,
    
    -- Última avaliação
    MAX(a.assessment_date) as last_assessment_date,
    
    -- Dias desde último treino
    EXTRACT(DAY FROM (CURRENT_DATE - MAX(DATE(ws.started_at)))) as days_since_last_session
    
FROM app.users u
LEFT JOIN app.workout_assignments wa ON u.id = wa.student_id AND wa.status = 'active'
LEFT JOIN app.workout_sessions ws ON wa.id = ws.assignment_id AND ws.status = 'completed'
LEFT JOIN app.session_entries se ON ws.id = se.session_id
LEFT JOIN app.assessments a ON u.id = a.student_id

WHERE u.user_type = 'student'

GROUP BY u.id, u.full_name, u.profile_photo_url;
```

## 5. FUNÇÕES AUXILIARES

### 5.1. Função: `get_student_workouts_for_date`

```sql
-- Função para obter treinos de um aluno em uma data específica
CREATE OR REPLACE FUNCTION app.get_student_workouts_for_date(
    p_student_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    assignment_id UUID,
    workout_id UUID,
    workout_name TEXT,
    workout_description TEXT,
    difficulty TEXT,
    estimated_duration_minutes INTEGER,
    exercises JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wa.id,
        w.id,
        w.name,
        w.description,
        w.difficulty,
        w.estimated_duration_minutes,
        json_agg(
            json_build_object(
                'id', we.id,
                'exercise_id', e.id,
                'name', e.name,
                'description', e.description,
                'muscle_groups', e.muscle_groups,
                'video_urls', e.video_urls,
                'order', we.order,
                'sets', we.sets,
                'reps', we.reps,
                'rest_time_seconds', we.rest_time_seconds,
                'suggested_weight_kg', we.suggested_weight_kg,
                'notes', we.notes
            ) ORDER BY we.order
        )
    FROM app.workout_assignments wa
    JOIN app.workouts w ON wa.workout_id = w.id
    JOIN app.workout_exercises we ON w.id = we.workout_id
    JOIN app.exercises e ON we.exercise_id = e.id
    WHERE 
        wa.student_id = p_student_id
        AND wa.status = 'active'
        AND wa.start_date <= p_date
        AND (wa.end_date IS NULL OR wa.end_date >= p_date)
        AND EXTRACT(DOW FROM p_date) = ANY(wa.frequency_days)
    GROUP BY wa.id, w.id, w.name, w.description, w.difficulty, w.estimated_duration_minutes;
END;
$$ LANGUAGE plpgsql STABLE;
```

## 6. TRIGGERS ADICIONAIS

### 6.1. Trigger para expirar convites

```sql
-- Função para marcar convites expirados
CREATE OR REPLACE FUNCTION app.expire_old_invites()
RETURNS VOID AS $$
BEGIN
    UPDATE app.trainer_students 
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Job agendado (executar diariamente)
SELECT cron.schedule('expire-old-invites', '0 0 * * *', 'SELECT app.expire_old_invites();');
```

### 6.2. Trigger para notificações de treino

```sql
-- Função para criar notificações
CREATE OR REPLACE FUNCTION app.notify_workout_completion()
RETURNS TRIGGER AS $$
DECLARE
    trainer_id UUID;
    student_name TEXT;
    workout_name TEXT;
BEGIN
    IF NEW.status = 'completed' THEN
        -- Obter dados para notificação
        SELECT 
            w.trainer_id, 
            u.full_name, 
            w.name 
        INTO 
            trainer_id, 
            student_name, 
            workout_name
        FROM app.workout_sessions ws
        JOIN app.workout_assignments wa ON ws.assignment_id = wa.id
        JOIN app.workouts w ON wa.workout_id = w.id
        JOIN app.users u ON wa.student_id = u.id
        WHERE ws.id = NEW.id;
        
        -- Inserir notificação (se tabela de notificações existir)
        -- INSERT INTO app.notifications (user_id, type, message) VALUES (...);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER workout_completion_notification
    AFTER UPDATE ON app.workout_sessions
    FOR EACH ROW
    WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
    EXECUTE FUNCTION app.notify_workout_completion();
```

## 7. ESTRATÉGIA DE BACKUP

### 7.1. Backup Automático do Supabase

O Supabase realiza backups automáticos diários:
- **RPO (Recovery Point Objective)**: 24 horas
- **RTO (Recovery Time Objective)**: 2 horas

### 7.2. Backup Manual (Opcional)

```bash
# Backup do schema
pg_dump --schema-only --schema=app --file=schema_backup.sql

# Backup dos dados
pg_dump --data-only --schema=app --file=data_backup.sql

# Backup completo
pg_dump --format=custom --file=full_backup.dump
```

## 8. MONITORAMENTO E PERFORMANCE

### 8.1. Queries de Monitoramento

```sql
-- Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'app'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Estatísticas de uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'app'
ORDER BY idx_scan DESC;

-- Queries lentas
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 8.2. Índices Recomendados

```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_workout_sessions_student_date ON app.workout_sessions(
    assignment_id, 
    DATE(started_at)
);

CREATE INDEX idx_session_entries_session_exercise ON app.session_entries(
    session_id, 
    workout_exercise_id
);

-- Índices para buscas por texto
CREATE INDEX idx_exercises_name_trgm ON app.exercises 
    USING gin(name gin_trgm_ops);

CREATE INDEX idx_exercises_description_trgm ON app.exercises 
    USING gin(description gin_trgm_ops);
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Banco de Dados
