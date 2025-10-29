ALTER TABLE public.notices
ADD COLUMN teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notices_teacher_id ON public.notices(teacher_id);
