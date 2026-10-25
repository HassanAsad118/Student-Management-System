// Shared validation for creating and editing student records.
const academicLevels = new Set([
  ...Array.from({ length: 8 }, (_, index) => `Semester ${index + 1}`),
  ...Array.from({ length: 4 }, (_, index) => `Year ${index + 1}`),
]);
const statuses = new Set(["Graduated", "Semester Freeze", "Active", "On Leave"]);

function validateStudent(body = {}) {
  const { studentId, fullName, email, course, academicLevel, status } = body || {};

  if ([studentId, fullName, email, course, academicLevel, status].some((value) => typeof value !== "string")) {
    return { error: "Student ID, name, email, course, semester/year, and status are required." };
  }

  const student = {
    studentId: studentId.trim().toUpperCase(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    course: course.trim(),
    academicLevel: academicLevel.trim(),
    status: status.trim(),
  };

  if (Object.values(student).some((value) => !value)) {
    return { error: "Please complete all student fields." };
  }

  if (student.studentId === "STU-" || !/^[A-Z0-9][A-Z0-9/_-]{0,39}$/.test(student.studentId)) {
    return { error: "Enter a complete Student ID, such as STU-001. Use up to 40 letters, numbers, hyphens, underscores, or slashes." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    return { error: "Enter a valid email address." };
  }

  if (!academicLevels.has(student.academicLevel)) {
    return { error: "Choose a valid semester or year." };
  }

  if (!statuses.has(student.status)) {
    return { error: "Choose a valid student status." };
  }

  if (
    student.status === "Graduated" &&
    !["Semester 8", "Year 4"].includes(student.academicLevel)
  ) {
    return { error: "Graduated status is only available for Semester 8 or Year 4." };
  }

  return { student };
}

module.exports = { validateStudent };
