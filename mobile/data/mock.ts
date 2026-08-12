import type { Lesson, PracticeCategory } from '@/types';

export const lessons: Lesson[] = [
  { id: '1', number: 1, title: 'Solfedjio', description: 'Solfedjio fani bilan tanishamiz.', progress: 100, durationMinutes: 12, status: 'completed', sections: [
    { id: '1-1', type: 'theory', title: 'Solfedjio nima?', description: 'Musiqani tinglash, o‘qish va his qilish asoslari.' },
    { id: '1-2', type: 'audio', title: 'Tinglab ko‘ring', description: 'Qisqa musiqiy misolni tinglang.' },
    { id: '1-3', type: 'quiz', title: 'Mini test', description: 'O‘rganganingizni tekshiring.' },
  ] },
  { id: '2', number: 2, title: 'Registr', description: 'Pastki, o‘rta va yuqori registrlarni farqlaymiz.', progress: 100, durationMinutes: 15, status: 'completed', sections: [
    { id: '2-1', type: 'theory', title: 'Registrlar', description: 'Tovush balandligiga ko‘ra registrlarni o‘rganamiz.' },
    { id: '2-2', type: 'audio', title: 'Eshitib farqlash', description: 'Uch xil registrdagi misollar.' },
    { id: '2-3', type: 'practice', title: 'Eshitib toping', description: 'Qaysi registr yangraganini aniqlang.' },
  ] },
  { id: '3', number: 3, title: 'Klaviatura', description: 'Fortepiano klaviaturasi va tovushlarni o‘rganamiz.', progress: 80, durationMinutes: 18, status: 'active', sections: [
    { id: '3-1', type: 'theory', title: 'Klaviatura tuzilishi', description: 'Oq va qora klavishlar tartibi.' },
    { id: '3-2', type: 'practice', title: 'Notani toping', description: 'Ko‘rsatilgan notani klaviaturadan toping.' },
  ] },
  { id: '4', number: 4, title: 'Nota yo‘li', description: 'Notalarning nota yo‘lida joylashishini o‘rganamiz.', progress: 60, durationMinutes: 16, status: 'active', sections: [
    { id: '4-1', type: 'theory', title: '5 ta chiziq', description: 'Nota yo‘li chiziqlari va oraliqlari.' },
    { id: '4-2', type: 'audio', title: 'Tovushni tinglang', description: 'Notalar qanday yangrashini eshiting.' },
    { id: '4-3', type: 'practice', title: 'Notani joylashtiring', description: 'Notani to‘g‘ri chiziq yoki oraliqqa qo‘ying.' },
    { id: '4-4', type: 'quiz', title: 'Dars testi', description: 'Dars bo‘yicha qisqa test.' },
  ] },
  { id: '5', number: 5, title: 'Skripka kaliti', description: 'Skripka kalitining vazifasi bilan tanishamiz.', progress: 0, durationMinutes: 14, status: 'locked', sections: [] },
];

export const practiceCategories: PracticeCategory[] = [
  { id: 'ear', title: 'Eshitish', subtitle: 'Tovush va registrni ajrating', icon: 'ear-outline' },
  { id: 'notes', title: 'Notalar', subtitle: 'Notalarni tez toping', icon: 'musical-notes-outline' },
  { id: 'rhythm', title: 'Ritm', subtitle: 'Ritmni tinglang va takrorlang', icon: 'pulse-outline' },
  { id: 'dictation', title: 'Musiqiy diktant', subtitle: 'Kuyni tinglab javob tanlang', icon: 'create-outline' },
  { id: 'tests', title: 'Testlar', subtitle: 'Bilimingizni tekshiring', icon: 'checkmark-circle-outline' },
];
