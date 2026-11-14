import React, { useState } from 'react';
import { UserCheck, Plus, Mail, Award, X, Check, ShieldCheck, UserPlus } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Instructor } from '../../types/lms';

interface InstructorManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  currentInstructorId?: string;
  onInstructorAssigned?: (instructor: Instructor) => void;
}

export const InstructorManagerModal: React.FC<InstructorManagerModalProps> = ({
  isOpen,
  onClose,
  courseId,
  currentInstructorId,
  onInstructorAssigned,
}) => {
  const { instructors, registerInstructor, assignInstructorToCourse } = useLms();
  const [activeTab, setActiveTab] = useState<'roster' | 'create'>('roster');

  // Form states for registering a new instructor
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarOption, setAvatarOption] = useState<string>('instructor');

  if (!isOpen) return null;

  const handleSelectInstructor = (inst: Instructor) => {
    assignInstructorToCourse(courseId, inst.id);
    if (onInstructorAssigned) onInstructorAssigned(inst);
    onClose();
  };

  const handleCreateInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim() || !email.trim()) return;

    const avatarUrl =
      avatarOption === 'student'
        ? '/assets/images/avatar_student_1793144128485.jpg'
        : '/assets/images/avatar_instructor_1793144141202.jpg';

    const newInst = registerInstructor({
      name: name.trim(),
      specialty: specialty.trim(),
      email: email.trim(),
      bio: bio.trim() || 'Docente titular en el Centro de Formación Profesional AGAPE.',
      avatar: avatarUrl,
    });

    assignInstructorToCourse(courseId, newInst.id);
    if (onInstructorAssigned) onInstructorAssigned(newInst);

    // Reset form
    setName('');
    setSpecialty('');
    setEmail('');
    setBio('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#3B2C73] to-[#4B3B8B] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#F2C94C]" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Gestión y Asignación de Docentes
              </h3>
              <p className="text-xs text-slate-200">
                Centro de Formación Profesional AGAPE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Docentes Registrados ({instructors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-[#4B3B8B] text-[#4B3B8B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Dar de Alta Nuevo Docente</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'roster' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 mb-2">
                Selecciona el docente responsable que figurará como instructor titular del curso y sus evaluaciones:
              </p>

              <div className="space-y-2.5">
                {instructors.length === 0 && (
                  <div className="p-5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                    No hay docentes registrados aún. Da de alta un docente desde esta pestaña o desde el Panel de Administración.
                  </div>
                )}
                {instructors.map((inst) => {
                  const isCurrent = inst.id === currentInstructorId;

                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleSelectInstructor(inst)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-[#4B3B8B] bg-[#FCF9EF] shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-[#6080B8] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={inst.avatar}
                          alt={inst.name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>{inst.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-[#4B3B8B] text-white px-2 py-0.5 rounded-full font-semibold">
                                Asignado
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#4B3B8B] font-medium flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{inst.specialty}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{inst.email}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-[#4B3B8B] text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isCurrent ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{isCurrent ? 'Actual' : 'Asignar'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateInstructor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Completo del Docente: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Roberto Solís"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Especialidad / Área Técnica: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Electrónica de Potencia & PLC"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Correo Electrónico Institucional: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@campus.agape.edu.sv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Breve Reseña / Perfil Profesional:
                </label>
                <textarea
                  rows={2}
                  placeholder="Años de experiencia, certificaciones o materias que imparte en CFP AGAPE..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4B3B8B] resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Foto de Perfil / Avatar Institucional:
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      name="avatar"
                      checked={avatarOption === 'instructor'}
                      onChange={() => setAvatarOption('instructor')}
                      className="text-[#4B3B8B]"
                    />
                    <img
                      src="/assets/images/avatar_instructor_1793144141202.jpg"
                      alt="Avatar 1"
                      className="w-7 h-7 rounded-full object-cover border"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Foto Formal Docente</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      name="avatar"
                      checked={avatarOption === 'student'}
                      onChange={() => setAvatarOption('student')}
                      className="text-[#4B3B8B]"
                    />
                    <img
                      src="/assets/images/avatar_student_1793144128485.jpg"
                      alt="Avatar 2"
                      className="w-7 h-7 rounded-full object-cover border"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Foto Ingeniera Docente</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white rounded-lg font-semibold shadow-2xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar y Asignar al Curso</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
