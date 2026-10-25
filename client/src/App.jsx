import { apiRequest } from "./api";
import { Icon } from "./UI";
import AuthGate from "./AuthGate";
import { useEffect, useState } from "react";

const emptyForm = {
  studentId: "STU-",
  fullName: "",
  email: "",
  course: "",
  academicLevel: "",
  status: "Active",
};

const statusOptions = ["Graduated", "Semester Freeze", "Active", "On Leave"];
const semesterOptions = Array.from({ length: 8 }, (_, index) => `Semester ${index + 1}`);
const yearOptions = Array.from({ length: 4 }, (_, index) => `Year ${index + 1}`);

function StatusBadge({ status }) {
  const tone = { Active: "active", Graduated: "graduated", "Semester Freeze": "semester-freeze", "On Leave": "on-leave" }[status] || "unknown";
  return <span className={`status-badge status-${tone}`}>{status || "Not set"}</span>;
}

function StudentDashboard({ user }) {
  const isAdmin = user.role === "admin";
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [sevenDaysAgo] = useState(
    () => Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [statusNotice, setStatusNotice] = useState("");
  const graduationEligible = ["Semester 8", "Year 4"].includes(form.academicLevel);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudents() {
      try {
        const data = await apiRequest("/api/students", {
          signal: controller.signal,
        });

        setStudents(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setLoadError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => controller.abort();
  }, []);

  function openAddForm() {
    setForm(emptyForm);
    setStatusNotice("");
    setEditingId(null);
    setSelectedStudent(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(student) {
    setStatusNotice("");
    setForm({
      studentId: student.studentId || "STU-",
      fullName: student.fullName,
      email: student.email,
      course: student.course,
      academicLevel: student.academicLevel || "",
      status: student.status || "",
    });

    setEditingId(student._id);
    setSelectedStudent(null);
    setError("");
    setShowForm(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextForm = { ...form, [name]: value };

    if (name === "academicLevel" || name === "status") {
      setStatusNotice("");
    }

    if (
      name === "academicLevel" &&
      form.status === "Graduated" &&
      !["Semester 8", "Year 4"].includes(value)
    ) {
      nextForm.status = "Active";
      setStatusNotice("Status changed to Active because Graduated requires Semester 8 or Year 4.");
    }

    setForm(nextForm);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    const values = {
      studentId: form.studentId.trim().toUpperCase(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      course: form.course.trim(),
      academicLevel: form.academicLevel,
      status: form.status,
    };

    if (!values.studentId || !values.fullName || !values.email || !values.course || !values.academicLevel || !values.status) {
      setError("Please complete every field.");
      return;
    }

    if (values.studentId === "STU-") {
      setError("Complete the Student ID after STU-, for example STU-001.");
      return;
    }

    if (values.status === "Graduated" && !graduationEligible) {
      setError("Graduated status is only available for Semester 8 or Year 4.");
      return;
    }

    setBusy(true);

    try {
      const path = editingId
        ? `/api/students/${editingId}`
        : "/api/students";

      const savedStudent = await apiRequest(path, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      setStudents((current) =>
        editingId
          ? current.map((student) =>
            student._id === editingId ? savedStudent : student
          )
          : [savedStudent, ...current]
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Delete ${student.fullName}? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await apiRequest(`/api/students/${student._id}`, {
        method: "DELETE",
      });

      setStudents((current) =>
        current.filter((item) => item._id !== student._id)
      );

      if (selectedStudent?._id === student._id) {
        setSelectedStudent(null);
      }

      if (editingId === student._id) {
        setShowForm(false);
        setEditingId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleView(student) {
    setBusy(true);
    setError("");

    try {
      const data = await apiRequest(`/api/students/${student._id}`);
      setSelectedStudent(data);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredStudents = students.filter((student) =>
    [student.studentId || "", student.fullName, student.email, student.course, student.academicLevel || "", student.status || ""].some((value) =>
      value.toLowerCase().includes(query)
    )
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );


  const recentCount = students.filter(
    (student) => new Date(student.createdAt).getTime() >= sevenDaysAgo
  ).length;

  const courseCount = new Set(
    students.map((student) => student.course.trim().toLowerCase())
  ).size;

  const recentStudents = [...students]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statsUnavailable = loading || Boolean(loadError);

  return (
    <main id="main-content" className="dashboard">
      <div className="page-heading">
        <div><p className="eyebrow">STUDENT RECORDS / OVERVIEW</p><h1>Dashboard</h1><p className="page-description">Manage student records in one place.</p></div>
        <span className="context-label">Devixo Solutions · Task 03</span>
      </div>

      {!isAdmin && <p className="notice">Read-only access. You can browse and search records; only admins can make changes.</p>}

      <section className="stats-grid" aria-label="Student statistics">
        <article className="stat-card"><span className="stat-icon"><Icon name="users" /></span><div><span>Total Students</span><strong>{statsUnavailable ? "—" : students.length}</strong><small>All saved records</small></div></article>
        <article className="stat-card"><span className="stat-icon"><Icon name="calendar" /></span><div><span>Last 7 Days</span><strong>{statsUnavailable ? "—" : recentCount}</strong><small>Recent registrations</small></div></article>
        <article className="stat-card"><span className="stat-icon"><Icon name="book" /></span><div><span>Courses</span><strong>{statsUnavailable ? "—" : courseCount}</strong><small>Distinct course names</small></div></article>
      </section>

      {error && <p role="alert">{error}</p>}
      {busy && <p role="status" className="status-line"><span className="spinner" />Processing your request...</p>}

      {showForm && (
        <section className="panel editor-panel" aria-labelledby="student-form-title">
          <div className="section-heading"><div><p className="eyebrow">STUDENT INFORMATION</p><h2 id="student-form-title">{editingId ? "Edit Student" : "Add Student"}</h2></div><button type="button" className="icon-button" aria-label="Close student form" disabled={busy} onClick={() => setShowForm(false)}><Icon name="close" /></button></div>
          <form onSubmit={handleSave}>
            <fieldset disabled={busy}>
              <legend className="sr-only">Student information</legend>
              <div className="form-grid">
                <div><label htmlFor="studentId">Student ID</label><input id="studentId" name="studentId" value={form.studentId} onChange={handleChange} placeholder="e.g. STU-001" maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9\/_\-]{0,39}" title="Use letters, numbers, hyphens, underscores, or slashes; start with a letter or number." aria-describedby="student-id-help" required /><small id="student-id-help" className="field-help">Complete the ID, e.g. STU-001. Each ID must be unique.</small></div>
                <div><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Student name" required /></div>
                <div><label htmlFor="email">Email address</label><input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="student@example.com" required /></div>
                <div><label htmlFor="course">Course</label><input id="course" name="course" value={form.course} onChange={handleChange} placeholder="e.g. Computer Science" required /></div>
                <div><label htmlFor="academicLevel">Semester / Year</label><select id="academicLevel" name="academicLevel" value={form.academicLevel} onChange={handleChange} required><option value="">Select semester or year</option><optgroup label="Semester">{semesterOptions.map((level) => <option key={level} value={level}>{level}</option>)}</optgroup><optgroup label="Year">{yearOptions.map((level) => <option key={level} value={level}>{level}</option>)}</optgroup></select></div>
                <div><label htmlFor="status">Status</label><select id="status" name="status" value={form.status} onChange={handleChange} aria-describedby="graduation-help" required><option value="">Select status</option>{statusOptions.map((status) => <option key={status} value={status} disabled={status === "Graduated" && !graduationEligible}>{status}</option>)}</select><small id="graduation-help" className="field-help">Graduated is available only for Semester 8 or Year 4.</small></div>
              </div>
              {statusNotice && <p role="status" className="notice">{statusNotice}</p>}
              <div className="form-actions"><button className="button-primary" type="submit">{busy ? "Saving..." : editingId ? "Save Changes" : "Save Student"}</button><button type="button" disabled={busy} onClick={() => setShowForm(false)}>Cancel</button></div>
            </fieldset>
          </form>
        </section>
      )}

      {selectedStudent && (
        <section className="panel details-panel" aria-labelledby="details-title">
          <div className="section-heading"><div><p className="eyebrow">RECORD OVERVIEW</p><h2 id="details-title">Student Details</h2></div><button type="button" className="icon-button" aria-label="Close student details" onClick={() => setSelectedStudent(null)}><Icon name="close" /></button></div>
          <dl className="details-grid"><div><dt>Student ID</dt><dd>{selectedStudent.studentId || "Not assigned"}</dd></div><div><dt>Full name</dt><dd>{selectedStudent.fullName}</dd></div><div><dt>Email address</dt><dd>{selectedStudent.email}</dd></div><div><dt>Course</dt><dd>{selectedStudent.course}</dd></div><div><dt>Semester / Year</dt><dd>{selectedStudent.academicLevel || "Not set"}</dd></div><div><dt>Status</dt><dd><StatusBadge status={selectedStudent.status} /></dd></div><div><dt>Registered</dt><dd>{new Date(selectedStudent.createdAt).toLocaleString()}</dd></div></dl>
        </section>
      )}

      <section className="panel" aria-labelledby="students-title">
        <div className="section-heading"><div><h2 id="students-title">Students <span className="count-badge">{statsUnavailable ? "—" : students.length}</span></h2><p className="section-description">Browse, search, and manage your student directory.</p></div><button type="button" className="button-primary" onClick={openAddForm} disabled={!isAdmin || loading || busy || Boolean(loadError)} title={!isAdmin ? "Only admins can add students" : undefined}><Icon name="plus" />Add Student</button></div>
        <label className="sr-only" htmlFor="search">Search students by ID, name, email, course, semester/year, or status</label>
        <div className="search-field"><Icon name="search" /><input id="search" type="search" placeholder="Search ID, name, email, course, semester or status" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>

        {loading ? <p role="status" className="empty-state"><span className="spinner" />Loading student records...</p> : loadError ? <p role="alert">{loadError}</p> : filteredStudents.length === 0 ? <div className="empty-state"><Icon name="users" /><h3>{search.trim() ? "No matching students" : "Your directory is empty"}</h3><p>{search.trim() ? "Try a different ID, name, email, course, semester, or status." : isAdmin ? "Add your first student to get started." : "Student records will appear here when an admin adds them."}</p></div> : (
          <div className="table-wrap"><table className="student-table"><caption className="sr-only">Student directory</caption><thead><tr><th scope="col">Student ID</th><th scope="col">Student</th><th scope="col">Email</th><th scope="col">Course</th><th scope="col">Semester / Year</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>
            {paginatedStudents.map((student) => (
              <tr key={student._id}>
                <td className="student-id-cell" data-label="Student ID">{student.studentId || "Not assigned"}</td>
                <td className="student-name-cell"><div className="person"><span className="avatar" aria-hidden="true">{student.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div className="person-info"><strong>{student.fullName}</strong></div></div></td>
                <td className="email-cell" data-label="Email">{student.email}</td>
                <td data-label="Course"><span className="course-tag">{student.course}</span></td>
                <td data-label="Semester / Year">{student.academicLevel || "Not set"}</td>
                <td data-label="Status"><StatusBadge status={student.status} /></td>
                <td className="actions-cell"><div className="row-actions"><button type="button" disabled={busy} aria-label={`View details for ${student.fullName}`} onClick={() => handleView(student)}>View</button><button type="button" className="button-edit" disabled={!isAdmin || busy} aria-label={`Edit ${student.fullName}`} onClick={() => openEditForm(student)}>Edit</button><button type="button" className="button-danger" disabled={!isAdmin || busy} aria-label={`Delete ${student.fullName}`} onClick={() => handleDelete(student)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody></table></div>
        )}

        {!loading && !loadError && filteredStudents.length > 0 && (
          <nav className="pagination" aria-label="Student pages">
            <span aria-live="polite">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}{query ? " matches" : " students"}</span>
            <div className="page-controls"><button type="button" disabled={currentPage === 1 || busy} onClick={() => setPage(currentPage - 1)}>Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + index).map((number) => <button type="button" key={number} className={number === currentPage ? "page-active" : "page-number"} aria-current={number === currentPage ? "page" : undefined} aria-label={`Page ${number}`} disabled={busy} onClick={() => setPage(number)}>{number}</button>)}
              <button type="button" disabled={currentPage === totalPages || busy} onClick={() => setPage(currentPage + 1)}>Next</button></div>
          </nav>
        )}
      </section>

      <section className="panel" aria-labelledby="recent-title">
        <div className="section-heading"><div><h2 id="recent-title">Recent Registrations</h2><p className="section-description">The five newest additions to your directory.</p></div><span className="section-icon"><Icon name="calendar" /></span></div>
        {loading ? <p role="status">Loading recent registrations...</p> : loadError ? <p className="empty-state">Recent registrations are unavailable.</p> : recentStudents.length === 0 ? <p className="empty-state">No registrations yet.</p> : (
          <ul className="recent-list">{recentStudents.map((student) => <li key={student._id}><div className="person"><span className="avatar" aria-hidden="true">{student.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><strong>{student.fullName}</strong></div><span className="recent-course">{student.course}</span><time dateTime={student.createdAt}>{new Date(student.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></li>)}</ul>
        )}
      </section>
      <footer className="page-footer">Student Management System</footer>
    </main>
  );
}

export default function App() {
  return <AuthGate>{(user) => <StudentDashboard user={user} />}</AuthGate>;
}
