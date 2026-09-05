import { Button, EmptyState, GridCardsSkeleton } from '@/features/shared/components';
import ClassForm from './parts/ClassForm';
import ClassCard from './parts/ClassCard';
import { useClasses } from './parts/useClasses';

export default function ClassesSection() {
  const {
    classes,
    templates,
    loading,
    showForm,
    editingClass,
    setShowForm,
    setEditingClass,
    createClass,
    updateClass,
    deleteClass,
    createSection,
    updateSection,
    deleteSection,
  } = useClasses();

  const sectionOptions = templates.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditingClass(null); setShowForm(true); }}>Add Class</Button>
      </div>

      {(showForm || editingClass) && (
        <ClassForm
          key={editingClass?.id ?? 'new'}
          initial={editingClass ? { name: editingClass.name, order: String(editingClass.order) } : undefined}
          initialSections={editingClass?.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity != null ? String(s.capacity) : '',
            roomNumber: s.roomNumber ?? '',
          }))}
          sectionOptions={sectionOptions}
          onClose={() => { setShowForm(false); setEditingClass(null); }}
          onSubmit={editingClass ? updateClass : createClass}
        />
      )}

      {loading ? (
        <GridCardsSkeleton count={4} cols={2} />
      ) : classes.length === 0 ? (
        <EmptyState icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} title="No classes yet" description="Create your first class with Add Class — you'll assign sections from the pool." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              className={c.name}
              classId={c.id}
              sections={c.sections}
              onEditClass={() => { setShowForm(false); setEditingClass(c); }}
              onDeleteClass={() => deleteClass(c)}
              onCreateSection={createSection}
              onUpdateSection={updateSection}
              onDeleteSection={deleteSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
