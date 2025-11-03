import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, DownloadIcon, BookOpenIcon } from '../common/Icons';
import { CartoonMovie, ToastType } from '../../types';
import { getPublishedCartoonMovies } from '../../services/storageService';
import Loader from '../common/Loader';
import { useToast } from '../../useToast';

const MovieDetailView: React.FC<{ movie: CartoonMovie; onBack: () => void }> = ({ movie, onBack }) => {
    return (
        <div className="fade-in">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى قائمة الأفلام</span>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                <div className="md:col-span-1">
                    <img src={movie.posterUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover rounded-2xl shadow-lg" />
                </div>
                <div className="md:col-span-2 space-y-8">
                    <h2 className="text-4xl font-extrabold text-[var(--text-primary)]">{movie.title}</h2>
                    
                    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-primary)]">
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-purple-400"/> القصة</h3>
                        <p className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{movie.story}</p>
                    </div>
                    
                    {/* NEW Instructions Card */}
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-white"><DownloadIcon className="w-6 h-6 text-purple-400"/> التحميل والتشغيل</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                             <div className="md:w-1/3 flex-shrink-0">
                                <img src={movie.instructionsThumbnailUrl} alt="تعليمات" className="w-full rounded-lg object-cover aspect-square"/>
                            </div>
                            <div className="flex-1 space-y-5">
                                 <div>
                                    <h4 className="font-semibold text-purple-300 mb-2">خطوات التحميل:</h4>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                                        {movie.downloadInstructions.split('\n').map((line, i) => <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>)}
                                    </ol>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-purple-300 mb-2">خطوات التشغيل:</h4>
                                     <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                                         {movie.loadInstructions.split('\n').map((line, i) => <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>)}
                                    </ol>
                                </div>
                            </div>
                        </div>
                         <a href={movie.downloadUrl} target="_blank" rel="noopener noreferrer" 
                            className="mt-6 w-full flex items-center justify-center gap-3 text-center py-3 px-6 font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-purple-500/20">
                            <DownloadIcon className="w-5 h-5"/>
                            اضغط هنا لبدء التحميل
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};


const MovieCard: React.FC<{ movie: CartoonMovie; onClick: () => void; }> = ({ movie, onClick }) => (
  <button onClick={onClick} className="w-full bg-[var(--bg-secondary)] rounded-lg shadow-lg overflow-hidden group flex flex-col text-right">
    <div className="relative">
      <img src={movie.posterUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105" />
    </div>
    <div className="p-4 text-center flex flex-col flex-grow justify-center">
      <h3 className="text-md font-semibold text-[var(--text-primary)]">{movie.title}</h3>
    </div>
  </button>
);

const CartoonMoviesView: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
  const [movies, setMovies] = useState<CartoonMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<CartoonMovie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchMovies = async () => {
        setIsLoading(true);
        try {
            const data = await getPublishedCartoonMovies();
            setMovies(data);
        } catch (error) {
            console.error("Failed to fetch movies", error);
            addToast("فشل تحميل الأفلام.", ToastType.ERROR);
        } finally {
            setIsLoading(false);
        }
    };
    fetchMovies();
  }, [addToast]);

  if (selectedMovie) {
    return <MovieDetailView movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">أفلام الكرتون</h1>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader/></div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} onClick={() => setSelectedMovie(movie)} />
            ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
            <p className="text-[var(--text-secondary)]">لا توجد أفلام متاحة حاليًا.</p>
        </div>
      )}
    </div>
  );
};

export default CartoonMoviesView;