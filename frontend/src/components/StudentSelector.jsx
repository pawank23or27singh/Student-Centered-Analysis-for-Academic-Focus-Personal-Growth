export function StudentSelector({ students, selectedStudentId, setSelectedStudentId }) {
  return (
    <div className="rounded-3xl bg-white/90 p-6 shadow-panel">
      <label className="block text-sm uppercase tracking-[0.28em] text-primary/60">Choose student</label>
      <select
        value={selectedStudentId}
        onChange={(event) => setSelectedStudentId(Number(event.target.value))}
        className="mt-4 w-full rounded-2xl border border-primary/10 bg-surface px-4 py-3 text-primary outline-none"
      >
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.full_name} ({student.roll_no})
          </option>
        ))}
      </select>
    </div>
  );
}
