import React from 'react';
import { X, Play, Clock, BookOpen, Award, CheckCircle } from 'lucide-react';
import { Course } from '../../types/lms';
import { VideoPlayer } from './VideoPlayer';

interface TrailerModalProps {
  course: Course | null;
  onClose: () => void;
  onEnroll: (courseId: string) => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  course,
  onClose,
  onEnroll,
}) => {
  if (!course) return null;

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalMinutes = course.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.durationMinutes, 0),
    0
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Video Introductorio Oficial
            </span>
            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{course.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Dedicated Video Player for Trailer */}
          <div className="w-full">
            <VideoPlayer
              src={course.trailerVideoUrl}
              poster={course.coverImage}
              title={`Trailer: ${course.title}`}
            />
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-base font-bold text-slate-900">Sobre este curso</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>

              {/* Highlights */}
              <div className="pt-2 space-y-2">
                <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Lo que aprenderás en los módulos:
                </h5>
                <ul className="grid grid-cols-1 gap-2 text-sm text-slate-700">
                  {course.modules.slice(0, 3).map((mod, idx) => (
                    <li key={mod.id} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{mod.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-700 pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Inversión:</span>
                  <span className="text-xl font-bold font-mono text-slate-900">${course.price} USD</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{totalHours} horas de video</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>{course.modules.length} módulos · {totalLessons} lecciones</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>Certificado oficial incluido</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onEnroll(course.id);
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Ingresar al Aula Virtual</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
