import React, { useState } from 'react';
import { thermodynamicsChapters } from './data/chaptersData';
import { Sidebar } from './components/Sidebar';
import { Navbar, MainView } from './components/Navbar';
import { EBookReader } from './components/EBookReader';
import { SimulationLabGallery } from './components/SimulationLabGallery';
import { FormulaCheatSheet } from './components/FormulaCheatSheet';
import { HandwrittenNotesViewer } from './components/HandwrittenNotesViewer';

export function App() {
  const [currentView, setCurrentView] = useState<MainView>('reader');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const currentChapter =
    thermodynamicsChapters.find((c) => c.id === selectedChapterId) || thermodynamicsChapters[0];

  const handleNextChapter = () => {
    if (selectedChapterId < thermodynamicsChapters.length) {
      setSelectedChapterId((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapterId > 1) {
      setSelectedChapterId((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0F172A] dark:text-[#CBD5E1] flex flex-col font-sans selection:bg-[#14B8A6]/30 selection:text-[#5EEAD4]">
      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        <Sidebar
          selectedChapterId={selectedChapterId}
          onSelectChapter={(id) => {
            setSelectedChapterId(id);
            setCurrentView('reader');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <Navbar
            currentView={currentView}
            onSelectView={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
          />

          <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 pt-2 md:pt-3 pb-8 pb-safe max-w-7xl w-full mx-auto">
            {currentView === 'reader' && (
              <EBookReader
                chapter={currentChapter}
                onNextChapter={handleNextChapter}
                onPrevChapter={handlePrevChapter}
                hasNextChapter={selectedChapterId < thermodynamicsChapters.length}
                hasPrevChapter={selectedChapterId > 1}
              />
            )}

            {currentView === 'simlab' && <SimulationLabGallery />}

            {currentView === 'formulas' && <FormulaCheatSheet />}

            {currentView === 'manuscript' && (
              <HandwrittenNotesViewer
                onSelectChapter={(id) => {
                  setSelectedChapterId(id);
                  setCurrentView('reader');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
