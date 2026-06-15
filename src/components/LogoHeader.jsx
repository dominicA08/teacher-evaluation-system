import aisatLogo from '../assets/images/aisat_logo.png';
import bscsLogo from '../assets/images/bscs_logo.png';

export default function LogoHeader() {
  return (
    <div className="flex items-center justify-center gap-6 md:gap-8 mb-6 animate-fade-in-up">
      <img 
        src={aisatLogo} 
        alt="AISAT College Seal" 
        className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(245,166,35,0.15)]"
      />
      <div className="w-[2px] h-12 md:h-16 bg-gradient-to-b from-transparent via-gold-primary to-transparent opacity-80" />
      <img 
        src={bscsLogo} 
        alt="BSCS Department Crest" 
        className="w-16 h-16 md:w-20 md:h-20 object-contain hover:scale-105 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(245,166,35,0.15)]"
      />
    </div>
  );
}
