import { useNavigate } from 'react-router-dom';
import { HYECUTS } from '../../data/hyecuts';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="py-12 md:py-16 px-6 md:px-12 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <button 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate('/');
          }}
          className="font-serif text-4xl font-light tracking-tighter italic hover:opacity-70 transition-opacity focus:outline-none"
        >
          Hyecuts<span className="text-zinc-300 dark:text-zinc-700">.</span>
        </button>
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
          {HYECUTS.address}
          <div className="mt-2 text-[9px] text-zinc-300 dark:text-zinc-600 font-medium">Developed By: Haziq Hamdan</div>
        </div>
      </div>
    </footer>
  );
}
