import { Button, EmptyState, GridCardsSkeleton } from '@/features/shared/components';
import YearForm from './parts/YearForm';
import YearCard from './parts/YearCard';
import { useAcademicYears, toDateInput } from './parts/useAcademicYears';

export default function AcademicYearsSection() {
  const {
    years,
    termsByYear,
    loading,
    showForm,
    editingYear,
    setShowForm,
    setEditingYear,
    createYear,
    updateYear,
    deleteYear,
    toggleCurrent,
    createTerm,
    updateTerm,
    deleteTerm,
  } = useAcademicYears();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditingYear(null); setShowForm(true); }}>Add Academic Year</Button>
      </div>

      {(showForm || editingYear) && (
        <YearForm
          key={editingYear?.id ?? 'new'}
          initial={editingYear
            ? { name: editingYear.name, startDate: toDateInput(editingYear.startDate), endDate: toDateInput(editingYear.endDate) }
            : undefined}
          onClose={() => { setShowForm(false); setEditingYear(null); }}
          onSubmit={editingYear ? updateYear : createYear}
        />
      )}

      {loading ? (
        <GridCardsSkeleton count={3} cols={2} />
      ) : years.length === 0 ? (
        <EmptyState icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} title="No academic years yet" description="Create your first academic year to start organizing terms, classes and promotions." />
      ) : (
        years.map((year) => (
          <YearCard
            key={year.id}
            year={year}
            terms={termsByYear[year.id] ?? []}
            onToggleCurrent={toggleCurrent}
            onEditYear={() => { setShowForm(false); setEditingYear(year); }}
            onDeleteYear={deleteYear}
            onCreateTerm={createTerm}
            onUpdateTerm={updateTerm}
            onDeleteTerm={deleteTerm}
          />
        ))
      )}
    </div>
  );
}
