import Link from 'next/link';
import { AppIcon } from '@/components/app-icon';
import { NoteStrip } from '@/components/note-strip';
import { SiteHeader } from '@/components/site-header';
import { figmaAssets } from '@/lib/figma-assets';

type FeatureIconName = 'gamepad' | 'music' | 'ear' | 'timer';

type FeatureIconProps = {
  name: FeatureIconName;
};

function FeatureIcon({ name }: FeatureIconProps) {
  const common = {
    width: 32,
    height: 32,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'gamepad') {
    return (
      <svg {...common}>
        <path d="M8.2 6.8h7.6c2.1 0 3.9 1.4 4.4 3.5l1.1 4.7c.5 2.2-1.9 3.9-3.7 2.6l-2.2-1.6H8.6l-2.2 1.6c-1.8 1.3-4.2-.4-3.7-2.6l1.1-4.7a4.5 4.5 0 0 1 4.4-3.5Z" />
        <path d="M7.2 10.2v3.6M5.4 12h3.6" />
        <circle cx="16.5" cy="10.8" r=".8" fill="currentColor" stroke="none" />
        <circle cx="18.3" cy="13" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === 'music') {
    return (
      <svg {...common}>
        <path d="M9 18V5.8l10-2V16" />
        <path d="M9 9.2l10-2" />
        <ellipse cx="6.2" cy="18" rx="2.8" ry="2.1" />
        <ellipse cx="16.2" cy="16" rx="2.8" ry="2.1" />
      </svg>
    );
  }

  if (name === 'ear') {
    return (
      <svg {...common}>
        <path d="M6.3 9.6a5.7 5.7 0 1 1 11.4.1c0 3.1-1.8 4.4-3.3 5.7-1.1 1-1.6 1.8-1.7 3.2-.1 1.3-1.1 2.4-2.5 2.4-1.5 0-2.6-1.2-2.6-2.7" />
        <path d="M9.3 10a2.7 2.7 0 1 1 5.4 0c0 1.4-.8 2.2-1.7 2.9-.9.7-1.5 1.4-1.5 2.6" />
        <path d="M7.7 15.2c.6.5 1.4.8 2.2.8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 13V9.2M12 13l2.8 1.8" />
      <path d="M9.3 2.8h5.4M12 5.5V3" />
      <path d="M17.7 7.3l1.4-1.4" />
    </svg>
  );
}

const features: Array<{
  tone: string;
  icon: FeatureIconName;
  iconColor: string;
  title: string;
  text: string;
}> = [
  { tone: '', icon: 'gamepad', iconColor: '#b43b73', title: 'Interaktiv darslar', text: "O'yinlar va qiziqarli topshiriqlar orqali bolalar nazariyani zerikmasdan o'rganishadi." },
  { tone: 'blue', icon: 'music', iconColor: '#2b8bc6', title: "Nota o'qish", text: 'Notalarni tez va oson tanish, skripka va bas kalitlarida mashq qilish tizimi.' },
  { tone: 'orange', icon: 'ear', iconColor: '#d88920', title: 'Quloq mashqlari', text: 'Musiqiy eshitish qobiliyatini, interval va akkordlarni aniqlash mahoratini oshirish.' },
  { tone: 'green', icon: 'timer', iconColor: '#2b9870', title: 'Ritm mashqlari', text: "Interaktiv metronom va qarsaklar orqali o'quvchilarda mukammal ritm tuyg'usini shakllantirish." },
];

const courses = [
  { grade: '1-SINF', tone: '', count: '32 ta mavzu', title: 'Nota savodi va dastlabki ritm', level: "Daraja: Boshlang'ich", href: '/kurs/1' },
  { grade: '2-SINF', tone: 'blue', count: '36 ta mavzu', title: 'Tonalnost va oddiy intervallar', level: "Daraja: O'rta-boshlang'ich", href: '#' },
  { grade: '3-SINF', tone: 'orange', count: '34 ta mavzu', title: 'Major va minor gammalari', level: "Daraja: O'rta", href: '#' },
  { grade: '4-SINF', tone: 'green', count: '40 ta mavzu', title: 'Uch tovushliklar va xromatizm', level: 'Daraja: Murakkab', href: '#' },
];

const teachers = [
  { tone: '', image: figmaAssets.teacher1, name: 'Malika Axmedova', role: "Solfedjio o'qituvchisi", place: "1-sonli bolalar musiqa va san'at maktabi" },
  { tone: 'blue', image: figmaAssets.teacher2, name: 'Sardor Rustamov', role: 'Kompozitor, Nazariyotchi', place: "Respublika musiqa va san'at litseyi" },
  { tone: 'orange', image: figmaAssets.teacher3, name: 'Nigora Umarova', role: 'Musiqa pedagogi', place: "5-sonli bolalar musiqa va san'at maktabi" },
  { tone: 'green', image: figmaAssets.teacher4, name: "Javohir To'rayev", role: 'Ritmika va xor mutaxassisi', place: "O'zbekiston Davlat Konservatoriyasi" },
];

const testimonials = [
  { tone: '', image: figmaAssets.testimonial1, name: 'Dilorom Yusupova', meta: 'Ota-ona (Toshkent)', quote: 'Solfedjio darslari qizim uchun eng qiyin fan edi. Ushbu platforma orqali darslarni o\'yinga aylantirdik, hozir o\'zi mustaqil nota mashqlarini bajaryapti.' },
  { tone: 'blue', image: figmaAssets.testimonial2, name: 'Sirojiddin Aliyev', meta: "Solfedjio fani o'qituvchisi", quote: "Musiqa va san'at maktabimizda ushbu platformadan foydalanishni boshlaganimizdan beri o'quvchilarning darsga qatnashish va faollik darajasi 2 barobar oshdi." },
  { tone: 'green', image: figmaAssets.testimonial3, name: 'Jasurbek (9 yosh)', meta: "O'quvchi", quote: "O'yinlar juda zo'r! Notalarni topish o'yinida har kuni sinfdoshlarim bilan musobaqalashamiz. Men hozir 3-sinf bosqichidaman." },
];

function WaveBars() {
  const heights = [12, 16, 8, 20, 14, 6, 18, 10];
  return <div className="wave-bars" aria-hidden="true">{heights.map((height, index) => <i key={index} style={{ height }} />)}</div>;
}

export default function HomePage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="badge blue"><AppIcon name="music" size={16} /> YANGI INTERAKTIV PLATFORMA</span>
            <h1 className="hero-title">Musiqa nazariyasini<br />o&apos;ynab <span>o&apos;rganing!</span></h1>
            <p className="hero-lead">Bolalar musiqa va san&apos;at maktablarining 1-7 sinf o&apos;quvchilari uchun maxsus ishlab chiqilgan, qiziqarli o&apos;yinlar va vizual notalar orqali solfedjio darslari.</p>
            <div className="hero-actions">
              <Link className="gradient-button" href="/kurs/1"><AppIcon name="rocket" size={18} /> Bepul darsni boshlang</Link>
              <Link className="outline-button" href="#features">Dastur bilan tanishish</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>10,000+</strong><span>O&apos;quvchilar</span></div>
              <div className="hero-stat"><strong>50+</strong><span>Musiqa maktablari</span></div>
              <div className="hero-stat"><strong>200+</strong><span>Interaktiv darslar</span></div>
            </div>
          </div>

          <div className="hero-media">
            <img src={figmaAssets.landingHero} alt="Solfedjio darsidagi bolalar" />
            <div className="wave-card">
              <span className="play-dot" aria-hidden="true"><AppIcon name="play" size={18} /></span>
              <div className="wave-copy"><strong>Ritm mashqi</strong><WaveBars /></div>
            </div>
          </div>
        </div>
      </section>

      <NoteStrip />

      <section className="section pink" id="features">
        <div className="container">
          <div className="section-head">
            <span className="badge pink">NIMA UCHUN SOLFEDJIO?</span>
            <h2>Zamonaviy musiqa ta&apos;limining kaliti</h2>
            <p>Darslarimiz bolalar musiqa maktablarining rasmiy dasturlari asosida mukammallashtirilgan.</p>
          </div>
          <div className="grid-4">
            {features.map((feature) => (
              <article className={`card ${feature.tone}`} key={feature.title}>
                <div className={`feature-icon feature-icon-${feature.tone || 'pink'}`} style={{ color: feature.iconColor }} aria-hidden="true">
                  <FeatureIcon name={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section blue" id="courses">
        <div className="container">
          <div className="section-head">
            <span className="badge" style={{ color: '#fff', background: 'linear-gradient(105deg,#2bb1ff,#4fc3f7)' }}>SINF DARSLIKLARI</span>
            <h2>Mashg&apos;ulotlar dasturi</h2>
            <p>Har bir sinf uchun bolaning yoshiga moslashtirilgan mukammal solfedjio kurslari.</p>
          </div>
          <div className="grid-4">
            {courses.map((course) => (
              <article className={`card course-card ${course.tone}`} key={course.grade}>
                <div className="course-top">
                  <span className={`course-badge ${course.tone}`}>{course.grade}</span>
                  <small>{course.count}</small>
                </div>
                <div>
                  <h3>{course.title}</h3>
                  <p className="course-level">{course.level}</p>
                </div>
                <div className="notation-block" aria-hidden="true" />
                <div className="course-footer">
                  {course.href === '#' ? <span style={{ color: '#9b7ea6', background: 'transparent', padding: 0 }}>Tez orada <AppIcon name="arrow-right" size={16} /></span> : <Link href={course.href}>Darsni boshlash <AppIcon name="arrow-right" size={16} /></Link>}
                  <span><AppIcon name="star" size={16} /> Musiqiy darslik</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section orange" id="teachers">
        <div className="container">
          <div className="section-head">
            <span className="badge orange">MUTAXASSIS PEDAGOGLAR</span>
            <h2>Bizning o&apos;qituvchilar</h2>
            <p>Respublikamizning eng nufuzli musiqa va san&apos;at maktablari ustozlari bilan hamkorlikda.</p>
          </div>
          <div className="grid-4">
            {teachers.map((teacher) => (
              <article className={`card teacher-card ${teacher.tone}`} key={teacher.name}>
                <div className="teacher-photo"><img src={teacher.image} alt={teacher.name} /></div>
                <h3>{teacher.name}</h3>
                <span className="teacher-role">{teacher.role}</span>
                <p>{teacher.place}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section pink" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="badge pink">QULAY REJALAR</span>
            <h2>O&apos;quv rejalari va narxlar</h2>
            <p>Farzandingiz va musiqa maktabingiz uchun eng to&apos;g&apos;ri ta&apos;lim paketini tanlang.</p>
          </div>
          <div className="grid-3">
            <article className="card price-card blue">
              <div><h3>Bepul sinov</h3><p className="muted">Dastlabki tanishuv va metodikani ko&apos;rish uchun</p></div>
              <div className="price">0 UZS</div>
              <ul><li>3 ta interaktiv dars</li><li>Boshlang&apos;ich nota savodxonligi</li><li>Musiqiy o&apos;yinlarga kirish (cheklangan)</li></ul>
              <Link className="outline-button" href="/kurs/1">Ulanish</Link>
            </article>

            <article className="card price-card dark">
              <span className="popular">ENG OMMABOP <AppIcon name="flame" size={14} /></span>
              <div><h3>Standart</h3><p className="muted">Solfedjio darslarini chuqur o&apos;rganish uchun</p></div>
              <div className="price">89,000 UZS</div>
              <ul><li>Barcha sinflar uchun darsliklar</li><li>100+ ritm va eshitish o&apos;yinlari</li><li>Ota-onalar uchun tahliliy shaxsiy kabinet</li><li>Oylik sertifikat va yutuqlar</li></ul>
              <Link className="gradient-button" href="/kurs/1">Ulanish <AppIcon name="rocket" size={18} /></Link>
            </article>

            <article className="card price-card green">
              <div><h3>Maktab uchun (Premium)</h3><p className="muted">To&apos;liq musiqa va san&apos;at maktabi sinflari uchun maxsus tarif</p></div>
              <div className="price">Kontakt</div>
              <ul><li>Barcha sinf o&apos;quvchilari uchun cheksiz profil</li><li>O&apos;qituvchilar uchun metodik dars rejalari</li><li>Sinflararo reyting va musobaqalar</li><li>24/7 Shaxsiy menejer qo&apos;llab-quvvatlashi</li></ul>
              <Link className="gradient-button" style={{ background: 'linear-gradient(105deg,#34d399,#2ec4b6)' }} href="#contact">Ulanish <AppIcon name="sparkle" size={18} /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="section green">
        <div className="container">
          <div className="section-head">
            <span className="badge green">OTA-ONALAR VA PEDAGOGLAR FIKRI</span>
            <h2>Mijozlarimiz sharhlari</h2>
            <p>Minglab bolalar va o&apos;qituvchilar allaqachon biz bilan musiqani osonroq o&apos;rganishmoqda.</p>
          </div>
          <div className="grid-3">
            {testimonials.map((item) => (
              <article className={`card testimonial ${item.tone}`} key={item.name}>
                <p>“{item.quote}”</p>
                <div className="person">
                  <span className="avatar"><img src={item.image} alt="" /></span>
                  <div><strong>{item.name}</strong><small>{item.meta}</small></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand"><span className="brand-mark"><AppIcon name="music" size={20} /></span><span>Solfedjio</span></div>
              <p>Bolalar musiqa va san&apos;at maktablari uchun interaktiv, qiziqarli va professional solfedjio darslari platformasi. Farzandingiz musiqa olamini sevib o&apos;rgansin.</p>
            </div>
            <div className="footer-col"><h3>Platforma</h3><Link href="#courses">Darsliklar</Link><Link href="#features">Mashqlar</Link><Link href="#teachers">Pedagoglar</Link><Link href="#pricing">Tariflar</Link></div>
            <div className="footer-col"><h3>Yordam</h3><span>FAQ</span><span>Qo&apos;llanma</span><span>Texnik ko&apos;mak</span><span>Xavfsizlik</span></div>
            <div className="footer-col"><h3>Bog&apos;lanish</h3><span>Telefon: +998 71 123-45-67</span><span>Email: info@solfedjio.uz</span><span>Manzil: Toshkent sh., Chilonzor tumani, 5-mavze</span></div>
          </div>
          <div className="footer-bottom"><span>Solfedjio © 2026. Barcha huquqlar himoyalangan.</span><span>Foydalanish shartlari · Maxfiylik siyosati</span></div>
        </div>
      </footer>
    </main>
  );
}
